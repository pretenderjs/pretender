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

  var FakeXMLHttpRequest = appearsBrowserified
    ? getModuleDefault(require('fake-xml-http-request'))
    : self.FakeXMLHttpRequest;

  /*
    The whatwg-fetch package is not importable in node because it accesses window.

    To keep the iife build of Pretender importable in node, we don't include
    whatwg-fetch if we're in a a non-browser-like enviroment. (Note: it's not
    enough to check if we're running in node, because Pretender works fine in a
    browser-like node enviroment, e.g. Jest.)

    The ES build of Pretender uses cross-fetch instead of whatwg-fetch, which
    works in both environments but doesn't provide a UMD build.
  */
  if (isBrowserLikeEnvironment) {
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
