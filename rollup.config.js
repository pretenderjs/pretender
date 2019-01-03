const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const pkg = require('./package.json');

const selfId = path.resolve(__dirname, 'src/iife-self-placeholder.js');

module.exports = {
  input: 'src/index.ts',
  external: [
    selfId,
    'whatwg-fetch',
    'fake-xml-http-request',
    'route-recognizer',
  ],
  output: [
    {
      name: 'Pretender',
      file: pkg.main,
      format: 'iife',
      globals: {
        [selfId]: 'self',
        'whatwg-fetch': 'FakeFetch',
        'fake-xml-http-request': 'FakeXMLHttpRequest',
        'route-recognizer': 'RouteRecognizer',
      },
      banner: 'var FakeFetch = self.WHATWGFetch;\n' +
              'var FakeXMLHttpRequest = self.FakeXMLHttpRequest;\n' +
              'var RouteRecognizer = self.RouteRecognizer;\n',
    },
    {
      file: pkg.module,
      format: 'es'
    },
  ],
  plugins: [
    commonjs(),
    resolve(),
    typescript()
  ],
};
