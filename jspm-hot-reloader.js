import Emitter from 'weakee'
import socketIO from 'socket.io-client'
class JspmHotReloader extends Emitter {
  constructor(backendUrl) {
    super()
    this.socket = socketIO(backendUrl)
    this.socket.on('change', (moduleName) => {
      this.emit('change', moduleName)
      this.hotReload(moduleName)
    });
  }
  hotReload(moduleName) {
    moduleName = location.origin + '/' + moduleName
    if (!System._loader.moduleRecords[moduleName]) {
      return
    }
    const module = System._loader.moduleRecords[moduleName]
    System.delete(moduleName)
    const toReimport = []
    function deleteAllImporters(importersToBeDeleted) {
      importersToBeDeleted.forEach((importer) => {
        System.delete(importer.name)
        if (importer.importers.length === 0) {
          toReimport.push(importer.name)
        } else {
          //recourse
          deleteAllImporters(importer.importers)
        }
        console.log('deleted ', importer.name)
      })

    }
    if (module.importers.length === 0) {
      toReimport.push(module.name)
    } else {
      deleteAllImporters(module.importers)
    }

    const promises = toReimport.map((moduleName) => {
      return System.import(moduleName).then(moduleReloaded => {
        console.log('reloaded ', moduleName)
      })
    })
    Promise.all(promises).then(() => {
      this.emit('reload', toReimport)
    })
  }
}
let instance

export default JspmHotReloader
