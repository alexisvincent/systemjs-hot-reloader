/* eslint-env browser */
import 'systemjs-hmr/dist/next.js'

import socketIO from 'socket.io-client'
import Emitter from 'weakee'
import debug from 'debug'
const d = debug('hot-reloader')

class HotReloader extends Emitter {
  constructor (backendUrl, transform = x => x) {
    super()

        // Set default backend URL
    if (!backendUrl) {
      backendUrl = '//' + document.location.host
    }

    this.socket = socketIO(backendUrl)

    this.socket.on('connect', () => {
      d('hot reload connected to watcher on ', backendUrl)
      this.socket.emit('identification', navigator.userAgent)
      this.socket.emit('package.json', (pjson) => {
                // self.pjson = pjson // maybe needed in the future?
        this.jspmConfigFile = pjson.jspm.configFile || 'config.js'
      })
    })

    this.socket.on('reload', () => {
      d('whole page reload requested')
      document.location.reload(true)
    })

    this.socket.on('change', (event) => {
      let moduleName = transform(event.path)
      this.emit('change', moduleName)
      if (moduleName === 'index.html' || moduleName === this.jspmConfigFile) {
        document.location.reload(true)
      } else {
        System.reload(moduleName)
      }
    })

        // emitting errors for jspm-dev-buddy
    window.onerror = (err) => {
      this.socket.emit('error', err)
    }

    this.socket.on('disconnect', () => {
      d('hot reload disconnected from ', backendUrl)
    })
  }
}

export default HotReloader
