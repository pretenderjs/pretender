const path = require('path');
const typescript = require('rollup-plugin-typescript');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const selfId = path.resolve(__dirname, 'src/iife-self-placeholder.ts');

module.exports = {
  input: 'src/index.ts',
  external: [
    selfId,
    '@xg-wang/whatwg-fetch',
    'fake-xml-http-request',
    'route-recognizer',
  ],
  output: [
    {
      name: 'Pretender',
      file: 'pretender.js',
      format: 'iife',
      globals: {
        [selfId]: 'self',
        '@xg-wang/whatwg-fetch': 'FakeFetch',
        'fake-xml-http-request': 'FakeXMLHttpRequest',
        'route-recognizer': 'RouteRecognizer',
      },
      banner: '/* exported Pretender */\n' +
              //'var self = window;\n' +
              'var FakeFetch = self.WHATWGFetch;\n' +
              'var FakeXMLHttpRequest = self.FakeXMLHttpRequest;\n' +
              'var RouteRecognizer = self.RouteRecognizer;\n',
    },
    {
      file: 'pretender.es.js',
      format: 'es'
    },
    {
      file: 'pretender.cjs.js',
      format: 'cjs'
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript()
  ],
};
