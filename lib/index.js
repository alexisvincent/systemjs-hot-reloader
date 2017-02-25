import 'systemjs-hmr'
import io from 'socket.io-client'
import debug from 'debug'
import merge from 'deepmerge'

const d = debug('systemjs-hot-reloader')

export default (options = {}) => {
  const {host} = merge({
    host: `//${document.location.hostname}:5776`
  }, options)

  const socket = io(host)

  const reloadPage = () => {
    d('whole page reload requested')
    document.location.reload(true)
  }

  const fileChanged = ({url, entries}) => {
    d('reloading', url)
    System.reload(SystemJS.baseURL + url, {entries})
  }

  socket.on('connect', () => {
    d('connected to ', host)
    socket.emit('identification', navigator.userAgent)
  })

  socket.on('disconnect', () => {
    d('disconnected from', host)
  })

  // UNSTABLE NEW API - TIED TO systemjs-tools for the moment
  socket.on('*', (event) => {
    switch (event.type) {
      case 'hmr': {
        fileChanged(event)
        break
      }
    }
  })

  // support for old api
  {
    socket.on('reload', reloadPage)

    socket.on('change', (event) => {
      if (event.path === 'index.html') reloadPage()
      else fileChanged({url: event.path})
    })

    // emitting errors for jspm-dev-buddy
    window.onerror = (err) => {
      socket.emit('error', err)
    }
  }
}
