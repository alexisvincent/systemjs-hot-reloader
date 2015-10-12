import socketIO from 'socket.io-client'
import Emitter from 'weakee'

class JspmHotReloader extends Emitter {
  constructor (backendUrl) {
    super()
    this.socket = socketIO(backendUrl)
    this.socket.on('change', (moduleName) => {
      this.emit('change', moduleName)
      this.hotReload(moduleName)
    })
  }
  deleteModule (moduleToDelete) {
    let name = moduleToDelete.name
    if (!this.modulesJustDeleted[name]) {
      this.modulesJustDeleted[name] = moduleToDelete
      if (typeof moduleToDelete.exports.__unload === 'function') {
        moduleToDelete.exports.__unload() // calling module unload hook
      }
      System.delete(name)
      this.emit('delete', name)
      console.log('deleted a module ', name)
    }
  }
  getModuleRecord (moduleName) {
    return System.normalize(moduleName).then(normalizedName => {
      let aModule = System._loader.moduleRecords[normalizedName]
      if (!aModule) {
        return System.normalize(moduleName + '!').then(normalizedName => {
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
    this.modulesJustDeleted = {}
    return this.getModuleRecord(moduleName).then(module => {
      this.deleteModule(module)
      const toReimport = []
      function deleteAllImporters (importersToBeDeleted) {
        importersToBeDeleted.forEach((importer) => {
          self.deleteModule(importer)
          if (importer.importers.length === 0 && toReimport.indexOf(importer.name) === -1) {
            toReimport.push(importer.name)
          } else {
            // recourse
            deleteAllImporters(importer.importers)
          }
        })
      }
      if (module.importers.length === 0) {
        toReimport.push(module.name)
      } else {
        deleteAllImporters(module.importers)
      }

      const promises = toReimport.map((moduleName) => {
        return System.import(moduleName).then(moduleReloaded => {
          console.log('reimported ', moduleName)
        }, (err) => {
          console.error(err)
          // revert the module back, so that next hotReload works
          System.set(moduleName, this.modulesJustDeleted[moduleName])
        })
      })
      return Promise.all(promises).then(() => {
        this.emit('allReimported', toReimport)
      })
    }, (err) => {
      err
      // not found any module for this file, not really an error
    })
  }
}

export default JspmHotReloader
