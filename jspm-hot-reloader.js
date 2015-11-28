/* eslint-env browser */
import socketIO from 'socket.io-client'
import Emitter from 'weakee'
import cloneDeep from 'lodash.clonedeep'
import debug from 'debug'
const d = debug('jspm-hot-reloader')

function identity (value) {
  return value
}

class JspmHotReloader extends Emitter {
  constructor (backendUrl, transform = identity) {
    System.trace = true
    if (!backendUrl) {
      backendUrl = '//' + document.location.host
    }
    super()
    this.originalSystemImport = System.import
    const self = this
    self.clientImportedModules = []
    System.import = function () {
      const args = arguments
      self.clientImportedModules.push(args[0])
      return self.originalSystemImport.apply(System, arguments).catch((err) => {
        self.lastFailedSystemImport = args
        throw err
      })
    }
    this.socket = socketIO(backendUrl)
    this.socket.on('connect', () => {
      console.log('hot reload connected to watcher on ', backendUrl)
      this.socket.emit('identification', navigator.userAgent)
    })
    this.socket.on('reload', () => {
      console.log('whole page reload requested')
      document.location.reload(true)
    })
    this.socket.on('change', (ev) => {  // babel doesn't work properly here, need self instead of this
      let moduleName = transform(ev.path)
      this.emit('change', moduleName)
      if (moduleName === 'index.html') {
        document.location.reload(true)
      } else {
        if (self.lastFailedSystemImport) {
          return self.originalSystemImport.apply(System, self.lastFailedSystemImport).then(() => {
            d(self.lastFailedSystemImport[0], 'broken module reimported succesfully')
            self.lastFailedSystemImport = null
          })
        }
        if (this.currentHotReload) {
          this.currentHotReload = this.currentHotReload.then(() => {
            // chain promises TODO we can solve this better- this often leads to the same module being reloaded mutliple times
            return self.hotReload(moduleName)
          })
        } else {
          this.currentHotReload = this.hotReload(moduleName)
        }
      }
    })
    window.onerror = (err) => {
      this.socket.emit('error', err)  // emitting errors for jspm-dev-buddy
    }
    this.socket.on('disconnect', () => {
      d('hot reload disconnected from ', backendUrl)
    })
    this.pushImporters(System.loads)
  }
  pushImporters (moduleMap, overwriteOlds) {
    Object.keys(moduleMap).forEach((moduleName) => {
      let mod = System.loads[moduleName]
      if (!mod.importers) {
        mod.importers = []
      }
      mod.deps.forEach((dependantName) => {
        let normalizedDependantName = mod.depMap[dependantName]
        let dependantMod = System.loads[normalizedDependantName]
        if (!dependantMod) {
          return
        }
        if (!dependantMod.importers) {
          dependantMod.importers = []
        }
        if (overwriteOlds) {
          let imsIndex = dependantMod.importers.length
          while (imsIndex--) {
            if (dependantMod.importers[imsIndex].name === mod.name) {
              dependantMod.importers[imsIndex] = mod
              return
            }
          }
        }
        dependantMod.importers.push(mod)
      })
    })
  }
  deleteModule (moduleToDelete, from) {
    let name = moduleToDelete.name
    if (!this.modulesJustDeleted[name]) {
      let exportedValue
      this.modulesJustDeleted[name] = moduleToDelete
      if (!moduleToDelete.exports) {
        // this is a module from System.loads
        exportedValue = System.get(name)
        if (!exportedValue) {
          d(`missing exported value on ${name}, reloading whole page because module record is broken`)
          return document.location.reload(true)
        }
      } else {
        exportedValue = moduleToDelete.exports
      }
      if (typeof exportedValue.__unload === 'function') {
        exportedValue.__unload() // calling module unload hook
      }
      System.delete(name)
      this.emit('deleted', moduleToDelete)
      d('deleted a module ', name, ' because it has dependency on ', from)
    }
  }
  getModuleRecord (moduleName) {
    return System.normalize(moduleName).then(normalizedName => {
      let aModule = System._loader.moduleRecords[normalizedName]
      if (!aModule) {
        aModule = System.loads[normalizedName]
        if (aModule) {
          return aModule
        }
        return System.normalize(moduleName + '!').then(normalizedName => {  // .jsx! for example are stored like this
          let aModule = System._loader.moduleRecords[normalizedName]
          if (aModule) {
            return aModule
          }
          throw new Error('module was not found in Systemjs moduleRecords')
        })
      }
      return aModule
    })
  }
  hotReload (moduleName) {
    const self = this
    const start = new Date().getTime()
    this.backup = { // in case some module fails to import
      moduleRecords: cloneDeep(System._loader.moduleRecords),
      loads: cloneDeep(System.loads)
    }

    this.modulesJustDeleted = {}  // TODO use weakmap
    return this.getModuleRecord(moduleName).then(module => {
      this.deleteModule(module, 'origin')
      let toReimport = []

      function deleteAllImporters (mod) {
        let importersToBeDeleted = mod.importers
        return importersToBeDeleted.map((importer) => {
          if (self.modulesJustDeleted.hasOwnProperty(importer.name)) {
            d('already deleted', importer.name)
            return false
          }
          self.deleteModule(importer, mod.name)
          if (importer.importers.length === 0 && toReimport.indexOf(importer.name) === -1) {
            toReimport.push(importer.name)
            return true
          } else {
            // recourse
            let deleted = deleteAllImporters(importer)
            return deleted
          }
        })
      }

      if (module.importers.length === 0) {
        toReimport.push(module.name)
      } else {
        let deleted = deleteAllImporters(module)
        if (deleted.find((res) => res === false) !== undefined) {
          toReimport.push(module.name)
        }
      }
      d('toReimport', toReimport)
      if (toReimport.length === 0) {
        toReimport = self.clientImportedModules
      }
      const promises = toReimport.map((moduleName) => {
        return this.originalSystemImport.call(System, moduleName).then(moduleReloaded => {
          console.log('reimported ', moduleName)
          if (typeof moduleReloaded.__reload === 'function') {
            const deletedModule = this.modulesJustDeleted[moduleName];
            if(deletedModule !== undefined) {
              moduleReloaded.__reload(deletedModule.exports) // calling module reload hook
            }
          }
        })
      })
      return Promise.all(promises).then(() => {
        this.emit('allReimported', toReimport)
        this.pushImporters(this.modulesJustDeleted, true)
        this.modulesJustDeleted = {}
        d('all reimported in ', new Date().getTime() - start, 'ms')
      }, (err) => {
        this.emit('error', err)
        console.error(err)
        System._loader.moduleRecords = self.backup.moduleRecords
        System.loads = self.backup.loads
      })
    }, (err) => {
      this.emit('moduleRecordNotFound', err)
      // not found any module for this file, not really an error
    })
  }
}

export default JspmHotReloader
