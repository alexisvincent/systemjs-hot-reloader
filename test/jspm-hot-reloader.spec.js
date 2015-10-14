/* eslint-env node, mocha */
/*global System*/
import HotReloader from '../jspm-hot-reloader'
import {expect} from 'chai'

describe('jspm-hot-reloader', function () {
  let hr

  global.System = {
    loads: []
  }

  it('should listen to socket.io and call hotReload on itself, when a change event comes', () => {
    hr = new HotReloader('')
    hr.on('change', (file) => {
      expect(file).to.equal(file)
    })
  })

  it('should revert back the tree if some import during hotReload fails', () => {

  })

  after(() => {
    hr.socket.disconnect()
  })
})
