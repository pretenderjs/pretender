var describe = QUnit.module;
var it = QUnit.test;

describe('pretender invoking by fetch', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('fetch triggers pretender', function(assert) {
    assert.expect(1);
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
      return [200, {}, ''];
    });

    var wait = fetch('/some/path');
    assert.ok(wasCalled);
    return wait;
  });

  it('is resolved asynchronously', function(assert) {
    assert.expect(2);
    var val = 'unset';

    this.pretender.get('/some/path', function() {
      return [200, {}, ''];
    });

    var wait = fetch('/some/path').then(function() {
      assert.equal(val, 'set');
    });

    assert.equal(val, 'unset');
    val = 'set';

    return wait;
  });

  it('can NOT be resolved synchronously', function(assert) {
    assert.expect(2);
    var val = 'unset';

    this.pretender.get(
      '/some/path',
      function() {
        return [200, {}, ''];
      },
      false
    );

    // This is async even we specified pretender get to be synchronised
    var wait = fetch('/some/path').then(function() {
      assert.equal(val, 'set');
    });
    assert.equal(val, 'unset');
    val = 'set';
    return wait;
  });

  it('has Abortable fetch', function(assert) {
    assert.expect(1);
    this.pretender.get(
      '/downloads',
      function(/*request*/) {
        return [200, {}, 'FAIL'];
      },
      200
    );

    var controller = new AbortController();
    var signal = controller.signal;
    setTimeout(function() {
      controller.abort();
    }, 10);

    return fetch('/downloads', { signal: signal })
      .then(function(response) {
        console.log(response);
        assert.ok(false, 'fetch resolved before the abort signal was sent');
      })
      .catch(function(err) {
        assert.equal(err.name, 'AbortError');
      });
  });
});
