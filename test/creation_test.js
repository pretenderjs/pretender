var pretender;
var describe = QUnit.module;
var it = QUnit.test;

describe('pretender creation - without shutdown', function(config) {
  var secondPretender;

  config.beforeEach(function() {
    pretender = new Pretender();
  });

  config.afterEach(function() {
    pretender.shutdown();
  });

  test('an error is thrown when you start a new pretender while another one is running', function(assert) {
    var message = 'You created a second Pretender instance while there ' +
                  'already one running. Running two Pretender servers at once will lead to unexpected results!';
    assert.throws(function() {
      new Pretender();
    }, message);
  });
});

describe('pretender creation', function(config) {
  config.afterEach(function() {
    if (pretender) {
      pretender.shutdown();
    }
    pretender = null;
  });

  test('a mapping function is optional', function(assert) {
    var result = false;
    try {
      pretender = new Pretender();
      result = true;
    } catch (e) {
      // fail
    }

    assert.ok(true, 'does not raise');
  });

  test('many maps can be passed on creation', function(assert) {
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

    $.ajax({url: '/some/path'});
    $.ajax({url: '/other/path'});

    assert.ok(aWasCalled);
    assert.ok(bWasCalled);
  });

  test('an error is thrown when a request handler is missing', function(assert) {
    assert.throws(function() {
      pretender = new Pretender();
      pretender.get('/path', undefined);
    }, 'The function you tried passing to Pretender to handle GET /path is undefined or missing.');
  });
});


