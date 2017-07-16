var describe = QUnit.module;
var it = QUnit.test;

describe('route not defined', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });
  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('calls unhandledRequest', function(assert) {
    this.pretender.unhandledRequest = function(verb, path) {
      assert.equal('GET', verb);
      assert.equal('not-defined', path);
      assert.ok(true);
    };

    $.ajax({
      url: 'not-defined',
    });
  });

  it('errors by default', function(assert) {
    var pretender = this.pretender;
    var verb = 'GET';
    var path = '/foo/bar';
    assert.throws(function() {
      pretender.unhandledRequest(verb, path);
    }, 'Pretender intercepted GET /foo/bar but no handler was defined for this type of request');
  });

  it('adds the request to the array of unhandled requests by default', function(
    assert
  ) {
    $.ajax({
      url: 'not-defined',
    });

    var req = this.pretender.unhandledRequests[0];
    assert.equal(req.url, 'not-defined');
  });
});
