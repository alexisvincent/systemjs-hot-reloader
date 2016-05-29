/* eslint-env browser */
import socketIO from 'socket.io-client'
import Emitter from 'weakee'
import debug from 'debug'
const d = debug('hot-reloader')

if (System.trace !== true) {
  console.warn('System.trace must be set to true via configuration before loading modules to hot-reload.')
}

function identity (value) {
  return value
}

class HotReloader extends Emitter {
  constructor (backendUrl, transform = identity) {
    if (!backendUrl) {
      backendUrl = '//' + document.location.host
    }
    super()
    this.originalSystemImport = System.import
    this.transform = transform
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
      d('hot reload connected to watcher on ', backendUrl)
      this.socket.emit('identification', navigator.userAgent)
      this.socket.emit('package.json', function (pjson) {
        // self.pjson = pjson // maybe needed in the future?
        self.jspmConfigFile = pjson.jspm.configFile || 'config.js'
      })
    })
    this.socket.on('reload', () => {
      d('whole page reload requested')
      document.location.reload(true)
    })
    this.socket.on('change', this.onFileChanged.bind(this))
    window.onerror = (err) => {
      this.socket.emit('error', err)  // emitting errors for jspm-dev-buddy
    }
    this.socket.on('disconnect', () => {
      d('hot reload disconnected from ', backendUrl)
    })
    this.pushImporters(System.loads)
  }
  onFileChanged (ev) {
    let moduleName = this.transform(ev.path)
    this.emit('change', moduleName)
    if (moduleName === 'index.html' || moduleName === this.jspmConfigFile) {
      document.location.reload(true)
    } else {
      if (this.lastFailedSystemImport) {  // for wehn inital System.import fails
        return this.originalSystemImport.apply(System, this.lastFailedSystemImport).then(() => {
          d(this.lastFailedSystemImport[0], 'broken module reimported succesfully')
          this.lastFailedSystemImport = null
        })
      }
      if (this.currentHotReload) {
        this.currentHotReload = this.currentHotReload.then(() => {
          // chain promises TODO we can solve this better- this often leads to the same module being reloaded mutliple times
          return this.hotReload(moduleName)
        })
      } else {
        if (this.failedReimport) {
          this.reImportRootModules(this.failedReimport, new Date())
        } else {
          this.currentHotReload = this.hotReload(moduleName)
        }
      }
    }
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
          console.warn(`missing exported value on ${name}, reloading whole page because module record is broken`)
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
        const fullModulePath = location.origin + '/' + moduleName
        const loadsKey = Object.keys(System.loads).find((n) => {
          return n.indexOf(fullModulePath) !== -1
        })
        // normalize does not yield a key which would match the key used in System.loads, so we have to improvise a bit
        if (loadsKey) {
          return System.loads[loadsKey]
        }
        throw new Error('module was not found in Systemjs moduleRecords')
      }
      return aModule
    })
  }
  hotReload (moduleName) {
    const self = this
    const start = new Date().getTime()

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

      if (typeof module.importers === 'undefined' || module.importers.length === 0) {
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
      return this.reImportRootModules(toReimport, start)
    }, (err) => {
      this.emit('moduleRecordNotFound', err)
      // not found any module for this file, not really an error
    })
  }
  reImportRootModules (toReimport, start) {
    const promises = toReimport.map((moduleName) => {
      return this.originalSystemImport.call(System, moduleName).then(moduleReloaded => {
        d('reimported ', moduleName)
        if (typeof moduleReloaded.__reload === 'function') {
          const deletedModule = this.modulesJustDeleted[moduleName]
          if (deletedModule !== undefined) {
            moduleReloaded.__reload(deletedModule.exports) // calling module reload hook
          }
        }
      })
    })
    return Promise.all(promises).then(() => {
      this.emit('allReimported', toReimport)
      this.pushImporters(this.modulesJustDeleted, true)
      this.modulesJustDeleted = {}
      this.failedReimport = null
      this.currentHotReload = null
      d('all reimported in ', new Date().getTime() - start, 'ms')
    }, (err) => {
      Object.keys(this.modulesJustDeleted).forEach((modName) => {
        d('deleting on failed reimport: ', modName) // failed import of a module leaves something in the SystemJS module cache, even though it is not visible in System._loader.moduleRecords we need to delete the module to revert to clean state
        System.delete(modName)
      })
      this.emit('error', err)
      console.error('Module "' + toReimport + '" reimport failed because this error was thrown: ', err)
      this.failedReimport = toReimport
      this.currentHotReload = null
    })
  }
}

export default HotReloader
