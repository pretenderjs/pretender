var Pretender = (function(self) {
  function getModuleDefault(module) {
    return module.default || module;
  }

  var appearsBrowserified =
    typeof self !== 'undefined' &&
    typeof process !== 'undefined' &&
    (Object.prototype.toString.call(process) === '[object Object]' ||
      Object.prototype.toString.call(process) === '[object process]');

  var RouteRecognizer = appearsBrowserified
    ? getModuleDefault(require('route-recognizer'))
    : self.RouteRecognizer;
  var FakeXMLHttpRequest = appearsBrowserified
    ? getModuleDefault(require('fake-xml-http-request'))
    : self.FakeXMLHttpRequest;

  const _Pretender = require('./src/pretender').default;

  if (typeof module === 'object') {
    module.exports = _Pretender;
  } else if (typeof define !== 'undefined') {
    define('pretender', [], function() {
      return _Pretender;
    });
  }

  self.Pretender = _Pretender;

  return Pretender;
})(self);
