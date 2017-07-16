var pretender;
var describe = QUnit.module;
var it = QUnit.test;

describe('pretender creation', function(config) {
  config.afterEach(function() {
    if (pretender) {
      pretender.shutdown();
    }
    pretender = null;
  });

  it('a mapping function is optional', function(assert) {
    var result = false;
    try {
      pretender = new Pretender();
      result = true;
    } catch (e) {
      // fail
    }

    assert.ok(true, 'does not raise');
  });

  it('many maps can be passed on creation', function(assert) {
    var aWasCalled = false;
    var bWasCalled = false;

    var mapA = function() {
      this.get('/some/path', function() {
        aWasCalled = true;
      });
    };

    var mapB = function() {
      this.get('/other/path', function() {
        bWasCalled = true;
      });
    };

    pretender = new Pretender(mapA, mapB);

    $.ajax({ url: '/some/path' });
    $.ajax({ url: '/other/path' });

    assert.ok(aWasCalled);
    assert.ok(bWasCalled);
  });

  it('an error is thrown when a request handler is missing', function(assert) {
    assert.throws(function() {
      pretender = new Pretender();
      pretender.get('/path', undefined);
    }, 'The function you tried passing to Pretender to handle GET /path is undefined or missing.');
  });
});
