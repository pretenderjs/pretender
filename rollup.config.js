const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const pkg = require('./package.json');

const globals = {
  'whatwg-fetch': 'FakeFetch',
  'fake-xml-http-request': 'FakeXMLHttpRequest',
  'route-recognizer': 'RouteRecognizer',
};

const iife = {
  banner:
`var Pretender = (function (self) {

  function getModuleDefault(module) {
    return module.default || module;	
  }

  var appearsBrowserified = typeof self !== 'undefined' &&
                            typeof process !== 'undefined' &&
                            (Object.prototype.toString.call(process) === '[object Object]' ||
                             Object.prototype.toString.call(process) === '[object process]');

  var RouteRecognizer = appearsBrowserified ? getModuleDefault(require('route-recognizer')) : self.RouteRecognizer;
  var FakeXMLHttpRequest = appearsBrowserified ? getModuleDefault(require('fake-xml-http-request')) :
    self.FakeXMLHttpRequest;

  // fetch related ponyfills
  var FakeFetch = appearsBrowserified ? getModuleDefault(require('whatwg-fetch')) : self.WHATWGFetch;
`,
  footer:
`
if (typeof module === 'object') {
  module.exports = Pretender;	
} else if (typeof define !== 'undefined') {	
  define('pretender', [], function() {	
    return Pretender;	
  });
}

self.Pretender = Pretender;

return Pretender;

}(self));`,
};

module.exports = {
  input: 'src/index.ts',
  external: Object.keys(pkg.dependencies),
  output: [
    {
      name: 'Pretender',
      file: pkg.main,
      format: 'iife',
      globals: globals,
      banner: iife.banner,
      footer: iife.footer,
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  plugins: [
    commonjs(),
    resolve(),
    typescript()
  ],
};
