const path = require('path');
const typescript = require('rollup-plugin-typescript');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const selfId = path.resolve(__dirname, 'src/iife-self-placeholder.ts');

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
      file: 'pretender.js',
      format: 'iife',
      globals: {
        [selfId]: 'self',
        'whatwg-fetch': 'FakeFetch',
        'fake-xml-http-request': 'FakeXMLHttpRequest',
        'route-recognizer': 'RouteRecognizer',
      },
      banner: '/* exported Pretender */\n' +
              'var FakeFetch = self.WHATWGFetch;\n' +
              'var FakeXMLHttpRequest = self.FakeXMLHttpRequest;\n' +
              'var RouteRecognizer = self.RouteRecognizer;\n',
    },
    {
      file: 'src/pretender.es.js',
      format: 'es'
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript()
  ],
};
