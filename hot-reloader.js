/* eslint-env browser */
import socketIO from 'socket.io-client'
import {HotReloaderFactory} from './factory'

export default HotReloaderFactory({
  getEmitter: socketIO,
  globals: {
    window, document
  }
})
