var describe = QUnit.module;
var it = QUnit.test;

describe('retruning an undefined response', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });
  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('calls erroredRequest callback', function(assert) {
    this.pretender.get('/some/path', function() {
      // return nothing
    });

    this.pretender.erroredRequest = function(verb, path, request, error) {
      var message =
        'Nothing returned by handler for ' +
        path +
        '. ' +
        'Remember to `return [status, headers, body];` in your route handler.';
      assert.equal(error.message, message);
    };

    $.ajax({ url: '/some/path' });
  });
});
