import 'systemjs-hmr'
import io from 'socket.io-client'
import debug from 'debug'
import merge from 'deepmerge'

const d = debug('systemjs-hot-reloader')

const isBrowser = typeof window !== 'undefined'
const isWorker = typeof WorkerGlobalScope !== 'undefined'

export default (opts = {}) => {
  const options = merge({
    entries: [],
    host: `//${location.hostname}:5776`
  }, opts)

  const {host} = options

  const socket = io(host)

  const reloadPage = () => {
    d('whole page reload requested')
    if (isBrowser) {
      location.reload(true)
    }
  }

  const fileChanged = ({url, entries=[]}) => {
    d('reloading', url)
    return System.reload(SystemJS.baseURL + url, {entries: [...entries, ...options.entries]})
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
        if (options.fileChanged) 
          options.fileChanged(event, fileChanged, options)
        else
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
      else 
        if (options.fileChanged) 
          options.fileChanged({url: event.path}, fileChanged, options)
        else
          fileChanged({url: event.path})
    })

    // emitting errors for jspm-dev-buddy
    if (isBrowser) {
      window.onerror = (err) => {
        socket.emit('error', err)
      }
    } else if (isWorker) {
      self.onerror = (err) => {
        socket.emit('error', err)
      }
    }
  }
}
