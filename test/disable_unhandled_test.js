var describe = QUnit.module;
var it = QUnit.test;

describe('disable unhandled request', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender({ disableUnhandled: true});
  });
  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('does not add unhandledRequest', function(assert) {
    $.ajax({ url: 'not-defined' });

    var req = this.pretender.unhandledRequests;
    assert.equal(req.length, 0);
  });
});
