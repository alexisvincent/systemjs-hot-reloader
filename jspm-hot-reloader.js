import Emitter from 'weakee'
import socketIO from 'socket.io-client'

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
    if (this.modulesAlreadyDeleted.indexOf(name) === -1) {
      System.delete(name)
      this.emit('delete', name)
      console.log('deleted a module ', name)
      this.modulesAlreadyDeleted.push(name)
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
    this.modulesAlreadyDeleted = []
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
