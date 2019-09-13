let QUnit = require('qunit');

let it = QUnit.test;

it('is importable in node', function(assert) {
  let Pretender = require('../dist/pretender');

  assert.equal(typeof Pretender, 'function');
});
