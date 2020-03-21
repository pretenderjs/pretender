const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const pkg = require('./package.json');
const fs = require('fs');
const globals = {
  'fake-xml-http-request': 'FakeXMLHttpRequest',
  'route-recognizer': 'RouteRecognizer',
  'url-parse': 'urlParse'
};

const rollupTemplate = fs.readFileSync('./iife-wrapper.js').toString();
const [banner, footer] = rollupTemplate.split('/*==ROLLUP_CONTENT==*/');

module.exports = {
  input: 'src/index.ts',
  external: Object.keys(pkg.dependencies),
  output: [
    {
      name: 'Pretender',
      file: pkg.main,
      format: 'iife',
      globals,
      banner,
      footer
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [commonjs(), resolve(), typescript()]
};
