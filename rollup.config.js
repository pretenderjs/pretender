const typescript = require('rollup-plugin-typescript');
const alias = require('rollup-plugin-alias');
const pkg = require('./package.json');
const fs = require('fs');
const globals = {
  'whatwg-fetch': 'FakeFetch',
  'fake-xml-http-request': 'FakeXMLHttpRequest',
  'route-recognizer': 'RouteRecognizer'
};

const rollupTemplate = fs.readFileSync('./iife-wrapper.js').toString();
const [ banner, footer ] = rollupTemplate.split('/*==ROLLUP_CONTENT==*/');

module.exports = [
  {
    input: 'src/index.ts',
    external: ['fake-xml-http-request', 'route-recognizer', 'whatwg-fetch'],
    output: [
      {
        name: 'Pretender',
        file: pkg.main,
        format: 'iife',
        globals,
        banner,
        footer
      },
    ],
    plugins: [
      alias({
        entries: [{ find: 'cross-fetch', replacement: 'whatwg-fetch' }]
      }),
      typescript()
    ]
  },
  {
    input: 'src/index.ts',
    external: ['fake-xml-http-request', 'route-recognizer', 'cross-fetch'],
    output: [
      {
        file: pkg.module,
        format: 'es',
      },
    ],
    plugins: [
      typescript()
    ]
  }
];
