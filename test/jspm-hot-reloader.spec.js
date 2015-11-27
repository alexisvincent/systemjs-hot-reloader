/* eslint-env node, mocha */

import HotReloader from '../jspm-hot-reloader'
import {expect} from 'chai'
import System from 'systemjs'
import '../config'
import chokidarEvEmitter from 'chokidar-socket-emitter'

describe('jspm-hot-reloader', function () {
  let hr
  global.document = {
    location: {
      host: 'localhost:8080'
    }
  }
  global.navigator = {
    userAgent: 'node.js'
  }
  let testApp
  before(() => {
    chokidarEvEmitter({port: 8090, path: 'test/fixtures-es6-react-project/public/'})

    return System.import('jspm-hot-reloader').then(function (HotReloader) {
      console.log(HotReloader.default)
      hr = new HotReloader.default()
      return System.import('test/fixtures-es6-react-project/public/app').then(function (_testApp_) {
        console.log('ran at ', new Date())
        testApp = _testApp_
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

  it('should remember what import calls were made since it loaded in importCallsMade', () => {

  })

  it('should transform path when pathTransform is a function', () => {

  })

  after(() => {
    // hr.socket.disconnect()
  })
})
