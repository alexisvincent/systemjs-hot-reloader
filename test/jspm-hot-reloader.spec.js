/* eslint-env node, mocha */
/*global System*/
import HotReloader from '../jspm-hot-reloader'
import {expect} from 'chai'

describe('jspm-hot-reloader', function () {
  let hr
  global.document = {
    location: {
      host: 'localhost:8080'
    }
  }
  global.System = {
    loads: []
  }
  before(() => {
    return System.import('capaj/jspm-hot-reloader').then(function(HotReloader){
      hr = new HotReloader.default()  // chokidar-socket-emitter port
      System.import('app').then(function () {
        console.log('ran at ', new Date())
      })
    })
  })

  it.skip('should listen to socket.io and call hotReload on itself, when a change event comes', () => {
    hr = new HotReloader()
    hr.on('change', (file) => {
      expect(file).to.equal(file)
    })
  })

  it('should revert back the tree if some import during hotReload fails', () => {

  })

  it('should not go into infinite loop when dependencies have circular references', () => {

  })

  it('should remember what import calls were made since it loaded in importCallsMade', function () {

  })

  it('should transform path when pathTransform is a function', () => {
    
  })

  after(() => {
    // hr.socket.disconnect()
  })
})
