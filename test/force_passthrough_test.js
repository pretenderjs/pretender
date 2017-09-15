var originalXMLHttpRequest;
var describe = QUnit.module;
var it = QUnit.test;

describe('passthrough requests', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender({ forcePassthrough: true });
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('passthrough request when forcePassthrough is true', function(assert) {
    var pretender = this.pretender;
    var done = assert.async();

    var passthroughInvoked = false;
    this.pretender.passthroughRequest = function(verb, path, request) {
      passthroughInvoked = true;
      assert.equal(verb, 'GET');
      assert.equal(path, '/some/path');
    };

    $.ajax({
      url: '/some/path',
      error: function(xhr) {
        assert.equal(xhr.status, 404);
        assert.ok(passthroughInvoked);
        done();
      }
    });
  });

  it('unhandle request when forcePassthrough is false', function(assert) {
    var pretender = this.pretender;
    pretender.forcePassthrough = false;

    this.pretender.unhandledRequest = function(verb, path, request) {
      assert.equal(verb, 'GET');
      assert.equal(path, '/some/path');
    };

    $.ajax({ url: '/some/path' });
  });
});
