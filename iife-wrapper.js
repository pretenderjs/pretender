var Pretender = (function(self) {
  function getModuleDefault(module) {
    return module.default || module;
  }

  var isBrowserLikeEnvironment = typeof window !== 'undefined';

  var appearsBrowserified =
    typeof self !== 'undefined' &&
    typeof process !== 'undefined' &&
    (Object.prototype.toString.call(process) === '[object Object]' ||
      Object.prototype.toString.call(process) === '[object process]');

  var RouteRecognizer = appearsBrowserified
    ? getModuleDefault(require('route-recognizer'))
    : self.RouteRecognizer;

  /*
    These libraries enable Pretender to work in a Browser. To keep Pretender
    importable in node, we don't include them if we're in a non-browser-like
    enviroment. (Note: it's not enough to check if we're running in node, because
    Pretender works fine in a browser-like node enviroment, e.g. Jest.)

    In the future if work is done to make Pretender function in node, other
    node-only deps could be imported in the else block.
  */
  if (isBrowserLikeEnvironment) {
    var FakeXMLHttpRequest = appearsBrowserified
      ? getModuleDefault(require('fake-xml-http-request'))
      : self.FakeXMLHttpRequest;

    // fetch related ponyfills
    var FakeFetch = appearsBrowserified
      ? getModuleDefault(require('whatwg-fetch'))
      : self.WHATWGFetch;
  }

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
})(typeof self !== 'undefined' ? self : {});
