var describe = QUnit.module;
var it = QUnit.test;

describe('Registry', function(config) {
  config.beforeEach(function() {
    this.registry = new Pretender.Registry();
  });

  it('has a "verbs" property', function(assert) {
    assert.ok(this.registry.verbs);
  });

  it('supports all HTTP verbs', function(assert) {
    var verbs = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
    for (var v = 0; v < verbs.length; v++) {
      assert.ok(this.registry.verbs[verbs[v]], 'supports ' + verbs[v]);
    }
  });
});
