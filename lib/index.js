import 'systemjs-hmr'
import io from 'socket.io-client'
import debug from 'debug'

const d = debug('systemjs-hot-reloader')

export default connect = (options = {}) => {
  const {host} = Object.assign({
    host: `//${document.location.host}`
  }, options)

  const socket = io(host)

  socket.on('connect', () => {
    d('hot reload connected to watcher on ', host)
    socket.emit('identification', navigator.userAgent)
    // this.socket.emit('package.json', (pjson) => {
    //   // self.pjson = pjson // maybe needed in the future?
    //   this.jspmConfigFile = pjson.jspm.configFile || 'config.js'
    // })
  })

  socket.on('reload', () => {
    d('whole page reload requested')
    document.location.reload(true)
  })

  socket.on('change', (event) => {
    let moduleName = transform(event.path)
    if (moduleName === 'index.html' || moduleName === this.jspmConfigFile) {
      document.location.reload(true)
    } else {
      System.reload(moduleName)
    }
  })

  // emitting errors for jspm-dev-buddy
  window.onerror = (err) => {
    socket.emit('error', err)
  }

  socket.on('disconnect', () => {
    d('hot reload disconnected from ', backendUrl)
  })
}

