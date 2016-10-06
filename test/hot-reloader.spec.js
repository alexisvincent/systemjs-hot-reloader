/* eslint-env node, mocha */
/*global System*/
'use strict'
const chai = require('chai')
const expect = chai.expect
const System = require('systemjs')
require('../config')

// mock jspm modules
System.set(
  System.normalizeSync('weakee'),
  System.newModule({default: require('events')}))

System.set(
  System.normalizeSync('debug'),
   System.newModule({__useDefault: true, default: () => () => null}))

const chokidarEvEmitter = require('chokidar-socket-emitter')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const Emitter = require('events')
chai.use(sinonChai)
// const jsdomify = require('jsdomify')

describe('hot-reloader unit tests', () => {
  let HotReloaderFactoryModule, HotReloaderFactory, SimpleHotReloader
  before((done) => {
    System.trace = true
    return Promise.all([
      System.import('factory')
    ])
      .then(mods => {
        HotReloaderFactoryModule = mods[0]
        HotReloaderFactory = mods[0].HotReloaderFactory
        SimpleHotReloader = mods[0].SimpleHotReloader
      })
      .then(done, done)
  })

  let emitter
  const originalSystemImport = System.import
  beforeEach(() => {
    emitter = new Emitter()
  })

  afterEach(() => {
    System.import = originalSystemImport
  })

  it('should create a hotReloader instance', () => {
    const hotReloader = new SimpleHotReloader('test', undefined, emitter)
    expect(hotReloader.transform).to.equal(HotReloaderFactoryModule.identity)
    expect(hotReloader.clientImportedModules).to.eql([])
  })

  it('should do a whole page reload if requested', () => {
    const spy = sinon.spy()
    const HotReloader = HotReloaderFactory({
      globals: {
        document: {
          location: {
            reload: spy
          }
        }
      }
    })
    const hotReloader = new HotReloader('test', undefined, emitter)
    emitter.emit('reload')
    expect(spy).to.have.been.calledWith(true)
  })

  it('should call onFileChanged on change event', () => {
    const hotReloader = new SimpleHotReloader('test', undefined, emitter)
    hotReloader.onFileChanged = sinon.spy()
    const arg = {}
    emitter.emit('change', arg)
    expect(hotReloader.onFileChanged).to.have.been.calledWith(arg)
  })
})

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

    chokidarServer = chokidarEvEmitter({ port: 8090, path: 'test/fixtures-es6-react-project/public/' })

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
