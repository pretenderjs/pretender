var describe = QUnit.module;
var it = QUnit.test;
var clock;

describe('pretender invoking by fetch', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    if (clock) {
      clock.restore();
    }
    this.pretender.shutdown();
  });

  it('fetch triggers pretender', function(assert) {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    fetch('/some/path');
    assert.ok(wasCalled);
  });

  it('is resolved asynchronously', function(assert) {
    assert.expect(2);
    var done = assert.async();
    var val = 'unset';

    this.pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    });

    fetch('/some/path').then(function() {
      assert.equal(val, 'set');
      done();
    });

    assert.equal(val, 'unset');
    val = 'set';
  });

  it('can NOT be resolved synchronously', function(assert) {
    assert.expect(1);
    var val = 0;

    this.pretender.get(
      '/some/path',
      function(request) {
        return [200, {}, ''];
      },
      false
    );

    fetch('/some/path').then(function() {
      // This won't be called
      assert.equal(val, 0);
      val++;
    });
    assert.equal(val, 0);
  });


  // TODO: Pretender doesn't work with abortable fetch
  // src in fake_xml_http_request.js
  // ```
  // abort: function abort() {
  //   this.aborted = true;
  //   this.responseText = null;
  //   this.errorFlag = true;
  //   this.requestHeaders = {};

  //   if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
  //     this._readyStateChange(FakeXMLHttpRequest.DONE);
  //     this.sendFlag = false;
  //   }

  //   this.readyState = FakeXMLHttpRequest.UNSENT;

  //   this.dispatchEvent(new _Event("abort", false, false, this));
  //   if (typeof this.onerror === "function") {
  //       this.onerror();
  //   }
  // }
  // ```
  // For `fake_xml_http_request` impl, the request is resolved once its state
  // is changed to `DONE` so the `reject` is not cathed.
  // So the senario happens in pretender is:
  // 1. state chagne to `DONE`, trigger resolve request
  // 2. abort, trigger reject
  // 3. xhr.onerror, trigger reject
  // The first resolve wins, error thus not rejected but an empty request is resolved.
  it('has NO Abortable fetch', function(assert) {
    assert.expect(1);
    var done = assert.async();
    var wasCalled = false;
    this.pretender.get(
      '/downloads',
      function(request) {
        return [200, {}, 'FAIL'];
      },
      200
    );

    var controller = new AbortController();
    var signal = controller.signal;
    setTimeout(function() {
      controller.abort();
    }, 10);
    fetch('/downloads', { signal: signal })
      .then(function(data) {
        assert.ok(data, 'AbortError was not rejected');
        done();
      })
      .catch(function(err) {
        // it should execute to here but won't due to FakeXmlHttpRequest limitation
        done();
      });
  });
});
