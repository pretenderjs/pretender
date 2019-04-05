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

  // fetch related ponyfills
  var FakeFetch = appearsBrowserified
    ? getModuleDefault(require('whatwg-fetch'))
    : self.WHATWGFetch;

  /*==ROLLUP_CONTENT==*/

  if (typeof module === 'object') {
    module.exports = Pretender;
  } else if (typeof define !== 'undefined') {
    define('pretender', [], function() {
      return Pretender;
    });
  }

  self.Pretender = Pretender;

  return Pretender;
})(self);
