const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const pkg = require('./package.json');

const globals = {
  'whatwg-fetch': 'FakeFetch',
  'fake-xml-http-request': 'FakeXMLHttpRequest',
  'route-recognizer': 'RouteRecognizer',
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
      banner: 'var FakeFetch = self.WHATWGFetch;\n' +
              'var FakeXMLHttpRequest = self.FakeXMLHttpRequest;\n' +
              'var RouteRecognizer = self.RouteRecognizer;\n\n' +
              'var Pretender = (function (self, RouteRecognizer, FakeXMLHttpRequest, FakeFetch) {',
      footer: 'return Pretender;\n}(self, RouteRecognizer, FakeXMLHttpRequest, FakeFetch));',
    },
    {
      name: 'Pretender',
      id: 'pretender',
      file: './dist/pretender.umd.js',
      format: 'umd',
      globals: globals,
      amd: {
        id: 'pretender',
      },
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
