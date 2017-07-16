var describe = QUnit.module;
var it = QUnit.test;

describe('pretender errored requests', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('calls erroredRequest', function(assert) {
    this.pretender.get('/some/path', function() {
      throw new Error('something in this handler broke!');
    });

    this.pretender.erroredRequest = function(verb, path, request, error) {
      assert.ok(error);
    };

    $.ajax({ url: '/some/path' });
  });
});
