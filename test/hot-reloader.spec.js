/* eslint-env node, mocha */
/*global System*/
'use strict'
const chai = require('chai')
const expect = chai.expect
const System = require('systemjs')
require('../config')
const chokidarEvEmitter = require('chokidar-socket-emitter')
// const jsdomify = require('jsdomify')

describe.skip('hot-reloader', function () {
  let hr
  global.document = {
    location: {
      host: 'localhost:8080',
      protocol: 'http:'
    }
  }
  global.navigator = {
    userAgent: 'node.js'
  }
  let testApp
  let chokidarServer
  before(() => {

    chokidarServer = chokidarEvEmitter({port: 8090, path: 'test/fixtures-es6-react-project/public/'})

    return System.import('hot-reloader').then(function (HotReloader) {
      console.log(HotReloader.default)
      hr = new HotReloader.default('http://localhost:8090')
      return System.import('test/fixtures-es6-react-project/public/app').then(function (_testApp_) {
        console.log('ran at ', new Date())
        testApp = _testApp_
      })
    })
  })

  it.skip('should listen to socket.io and call hotReload on itself, when a change event comes', (done) => {
    hr = new HotReloader('http://localhost:8090')
    hr.on('change', (file) => {
      expect(file).to.equal(file)
      done()
    })
  })

  it('should call __reload method on a module, when it reloaded it', function (done) {

  })

  it('should print out an error if reload fails', () => {

  })

  it('should not go into infinite loop when dependencies have circular references', () => {

  })

  it('should remember what import calls were made since it loaded in importCallsMade', () => {

  })

  it('should transform path when pathTransform is a function', () => {

  })

  after((done) => {
    // hr.socket.disconnect()

    chokidarServer.close(done)
  })
})
