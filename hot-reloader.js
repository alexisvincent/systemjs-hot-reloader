'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('systemjs-hmr');

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _weakee = require('weakee');

var _weakee2 = _interopRequireDefault(_weakee);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env browser */


var d = (0, _debug2.default)('hot-reloader');

var HotReloader = function (_Emitter) {
  _inherits(HotReloader, _Emitter);

  function HotReloader(backendUrl) {
    var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (x) {
      return x;
    };

    _classCallCheck(this, HotReloader);

    // Set default backend URL
    var _this = _possibleConstructorReturn(this, (HotReloader.__proto__ || Object.getPrototypeOf(HotReloader)).call(this));

    if (!backendUrl) {
      backendUrl = '//' + document.location.host;
    }

    _this.socket = (0, _socket2.default)(backendUrl);

    _this.socket.on('connect', function () {
      d('hot reload connected to watcher on ', backendUrl);
      _this.socket.emit('identification', navigator.userAgent);
      _this.socket.emit('package.json', function (pjson) {
        // self.pjson = pjson // maybe needed in the future?
        _this.jspmConfigFile = pjson.jspm.configFile || 'config.js';
      });
    });

    _this.socket.on('reload', function () {
      d('whole page reload requested');
      document.location.reload(true);
    });

    _this.socket.on('change', function (event) {
      var moduleName = transform(event.path);
      _this.emit('change', moduleName);
      if (moduleName === 'index.html' || moduleName === _this.jspmConfigFile) {
        document.location.reload(true);
      } else {
        System.reload(moduleName).catch(function (err) {
          _this.emit('moduleRecordNotFound', err);
          // not found any module for this file, not really an error
        });
      }
    });

    // emitting errors for jspm-dev-buddy
    window.onerror = function (err) {
      _this.socket.emit('error', err);
    };

    _this.socket.on('disconnect', function () {
      d('hot reload disconnected from ', backendUrl);
    });
    return _this;
  }

  return HotReloader;
}(_weakee2.default);

exports.default = HotReloader;