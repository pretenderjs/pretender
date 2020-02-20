module.exports = {
  'parser': '@typescript-eslint/parser',
  'globals': {
    'Pretender': true,
    'sinon': true, // karma-sinon
  },
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
    'jquery': true,
    'qunit': true,
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 2015,
    'sourceType': 'module'
  },
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  }
};
