import 'systemjs-hmr'
import io from 'socket.io-client'
import debug from 'debug'

const d = debug('systemjs-hot-reloader')

export default (options = {}) => {
  const {host} = Object.assign({
    host: `//${document.location.host}`
  }, options)

  const socket = io(host)

  socket.on('connect', () => {
    d('hot reload connected to watcher on ', host)
    socket.emit('identification', navigator.userAgent)
  })

  socket.on('reload', () => {
    d('whole page reload requested')
    document.location.reload(true)
  })

  socket.on('change', (event) => {
    let moduleName = event.path
    if (moduleName === 'index.html') {
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

