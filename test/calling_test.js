var describe = QUnit.module;
var it = QUnit.test;
var clock;

describe('pretender invoking', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    if (clock) { clock.restore(); }
    this.pretender.shutdown();
  });

  it('a mapping function is optional', function(assert) {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path' });
    assert.ok(wasCalled);
  });

  it('mapping can be called directly', function(assert) {
    var wasCalled;
    function map() {
      this.get('/some/path', function() {
        wasCalled = true;
      });
    }

    this.pretender.map(map);

    $.ajax({ url: '/some/path' });
    assert.ok(wasCalled);
  });

  it('clobbering duplicate mapping works', function(assert) {
    var wasCalled, wasCalled2;
    function map() {
      this.get('/some/path', function() {
        wasCalled = true;
      });
    }
    function map2() {
      this.get('/some/path', function() {
        wasCalled2 = true;
      });
    }

    this.pretender.map(map);
    this.pretender.map(map2);

    $.ajax({ url: '/some/path' });

    assert.ok(!wasCalled);
    assert.ok(wasCalled2);
  });

  it('ordered duplicate mapping works', function(assert) {
    var wasCalled, wasCalled2;
    function map() {
      this.get('/some/path', function() {
        wasCalled = true;
      });
    }

    this.pretender.map(map);
    $.ajax({ url: '/some/path' });

    function map2() {
      this.get('/some/path', function() {
        wasCalled2 = true;
      });
    }

    this.pretender.map(map2);
    $.ajax({ url: '/some/path' });

    assert.ok(wasCalled);
    assert.ok(wasCalled2);
  });

  it('params are passed', function(assert) {
    var params;
    this.pretender.get('/some/path/:id', function(request) {
      params = request.params;
    });

    $.ajax({ url: '/some/path/1' });
    assert.equal(params.id, 1);
  });

  it('queryParams are passed', function(assert) {
    var params;
    this.pretender.get('/some/path', function(request) {
      params = request.queryParams;
    });

    $.ajax({ url: '/some/path?zulu=nation' });
    assert.equal(params.zulu, 'nation');
  });

  it('request body is accessible', function(assert) {
    var params;
    this.pretender.post('/some/path/1', function(request) {
      params = request.requestBody;
    });

    $.ajax({
      method: 'post',
      url: '/some/path/1',
      data: {
        ok: true,
      },
    });
    assert.equal(params, 'ok=true');
  });

  it('request headers are accessible', function(assert) {
    var headers;
    this.pretender.post('/some/path/1', function(request) {
      headers = request.requestHeaders;
    });

    $.ajax({
      method: 'post',
      url: '/some/path/1',
      headers: {
        'A-Header': 'value',
      },
    });
    assert.equal(headers['A-Header'], 'value');
  });

  it('adds requests to the list of handled requests', function(assert) {
    var params;
    this.pretender.get('/some/path', function(request) {
      params = request.queryParams;
    });

    $.ajax({ url: '/some/path' });

    var req = this.pretender.handledRequests[0];
    assert.equal(req.url, '/some/path');
  });

  it("increments the handler's request count", function(assert) {
    var handler = function(req) {};

    this.pretender.get('/some/path', handler);

    $.ajax({ url: '/some/path' });

    assert.equal(handler.numberOfCalls, 1);
  });

  it('handledRequest is called', function(assert) {
    var done = assert.async();

    var json = '{foo: "bar"}';
    this.pretender.get('/some/path', function(req) {
      return [200, {}, json];
    });

    this.pretender.handledRequest = function(verb, path, request) {
      assert.ok(true, 'handledRequest hook was called');
      assert.equal(verb, 'GET');
      assert.equal(path, '/some/path');
      assert.equal(request.responseText, json);
      assert.equal(request.status, '200');
      done();
    };

    $.ajax({ url: '/some/path' });
  });

  it('prepareBody is called', function(assert) {
    var done = assert.async();

    var obj = { foo: 'bar' };
    this.pretender.prepareBody = JSON.stringify;
    this.pretender.get('/some/path', function(req) {
      return [200, {}, obj];
    });

    $.ajax({
      url: '/some/path',
      success: function(resp) {
        assert.deepEqual(JSON.parse(resp), obj);
        done();
      },
    });
  });

  it('prepareHeaders is called', function(assert) {
    var done = assert.async();

    this.pretender.prepareHeaders = function(headers) {
      headers['X-WAS-CALLED'] = 'YES';
      return headers;
    };

    this.pretender.get('/some/path', function(req) {
      return [200, {}, ''];
    });

    $.ajax({
      url: '/some/path',
      complete: function(xhr) {
        assert.equal(xhr.getResponseHeader('X-WAS-CALLED'), 'YES');
        done();
      },
    });
  });

  it('will use the latest defined handler', function(assert) {
    assert.expect(1);

    var latestHandlerWasCalled = false;
    this.pretender.get('/some/path', function(request) {
      assert.ok(false);
    });
    this.pretender.get('/some/path', function(request) {
      latestHandlerWasCalled = true;
    });
    $.ajax({ url: '/some/path' });
    assert.ok(latestHandlerWasCalled, 'calls the latest handler');
  });

  it('will error when using fully qualified URLs instead of paths', function(
    assert
  ) {
    var pretender = this.pretender;

    pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    });

    assert.throws(function() {
      pretender.handleRequest({ url: 'http://myserver.com/some/path' });
    });
  });

  it('is resolved asynchronously', function(assert) {
    var done = assert.async();
    var val = 'unset';

    this.pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    });

    $.ajax({
      url: '/some/path',
      complete: function() {
        assert.equal(val, 'set');
        done();
      },
    });

    assert.equal(val, 'unset');
    val = 'set';
  });

  it('can be resolved synchronous', function(assert) {
    var val = 0;

    this.pretender.get(
      '/some/path',
      function(request) {
        return [200, {}, ''];
      },
      false
    );

    $.ajax({
      url: '/some/path',
      complete: function() {
        assert.equal(val, 0);
        val++;
      },
    });

    assert.equal(val, 1);
  });

  it('can be both asynchronous or synchronous based on an async function', function(
    assert
  ) {
    var done = assert.async();

    var isAsync = false;
    var val = 0;

    this.pretender.get(
      '/some/path',
      function(request) {
        return [200, {}, ''];
      },
      function() {
        return isAsync;
      }
    );

    $.ajax({
      url: '/some/path',
      complete: function() {
        assert.equal(val, 0);
        val++;
      },
    });

    assert.equal(val, 1);
    val++;

    isAsync = 0;

    $.ajax({
      url: '/some/path',
      complete: function() {
        assert.equal(val, 3);
        done();
      },
    });

    assert.equal(val, 2);
    val++;
  });

  it('can be configured to resolve after a specified time', function(assert) {
    var done = assert.async();

    var val = 0;

    this.pretender.get(
      '/some/path',
      function(request) {
        return [200, {}, ''];
      },
      100
    );

    $.ajax({
      url: '/some/path',
      complete: function() {
        assert.equal(val, 1);
        done();
      },
    });

    setTimeout(function() {
      assert.equal(val, 0);
      val++;
    }, 0);
  });

  it('can be configured to require manually resolution', function(assert) {
    var val = 0;
    var req = $.ajaxSettings.xhr();

    this.pretender.get(
      '/some/path',
      function(request) {
        return [200, {}, ''];
      },
      true
    );

    $.ajax({
      url: '/some/path',
      xhr: function() {
        // use the xhr we already made and have a reference to
        return req;
      },
      complete: function() {
        assert.equal(val, 1);
        val++;
      },
    });

    assert.equal(val, 0);
    val++;

    this.pretender.resolve(req);

    assert.equal(val, 2);
  });

  it('requiresManualResolution returns true for endpoints configured with `true` for async', function(
    assert
  ) {
    this.pretender.get('/some/path', function(request) {}, true);
    this.pretender.get('/some/other/path', function() {});

    assert.ok(this.pretender.requiresManualResolution('get', '/some/path'));
    assert.ok(
      !this.pretender.requiresManualResolution('get', '/some/other/path')
    );
  });

  it(
    'async requests with `onprogress` upload events in the upload ' +
      ' trigger a progress event each 50ms',
    function(assert) {
      var done = assert.async();
      var progressEventCount = 0;
      this.pretender.post(
        '/uploads',
        function(request) {
          return [200, {}, ''];
        },
        300
      );

      var xhr = new window.XMLHttpRequest();
      xhr.open('POST', '/uploads');
      xhr.upload.onprogress = function(e) {
        progressEventCount++;
      };
      xhr.onload = function() {
        assert.equal(
          progressEventCount,
          5,
          'In a request of 300ms the progress event has been fired 5 times'
        );
        done();
      };
      xhr.send('some data');
    }
  );

  it("`onprogress` upload events don't keep firing once the request has ended", function(
    assert
  ) {
    clock = sinon.useFakeTimers();
    var progressEventCount = 0;
    this.pretender.post(
      '/uploads',
      function(request) {
        return [200, {}, ''];
      },
      210
    );

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/uploads');
    xhr.upload.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.send('some data');
    clock.tick(510);
    assert.equal(
      progressEventCount,
      4,
      'No `onprogress` events are fired after the the request finalizes'
    );
  });

  it('no progress upload events are fired after the request is aborted', function(
    assert
  ) {
    var progressEventCount = 0;

    clock = sinon.useFakeTimers();

    this.pretender.post(
      '/uploads',
      function(request) {
        return [200, {}, ''];
      },
      210
    );

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/uploads');
    xhr.upload.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.send('some data');

    clock.tick(90);
    xhr.abort();
    clock.tick(220);
    assert.equal(
      progressEventCount,
      1,
      'only one progress event was triggered because the request was aborted'
    );
  });

  it('async requests with `onprogress` events trigger a progress event each 50ms', function(
    assert
  ) {
    var done = assert.async();
    var progressEventCount = 0;
    this.pretender.get(
      '/downloads',
      function(request) {
        return [200, {}, ''];
      },
      300
    );

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/downloads');
    xhr.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.onload = function() {
      assert.equal(
        progressEventCount,
        5,
        'In a request of 300ms the progress event has been fired 5 times'
      );
      done();
    };
    xhr.send('some data');
  });

  it("`onprogress` download events don't keep firing once the request has ended", function(
    assert
  ) {
    clock = sinon.useFakeTimers();
    var progressEventCount = 0;
    this.pretender.get(
      '/downloads',
      function(request) {
        return [200, {}, ''];
      },
      210
    );

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/downloads');
    xhr.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.send('some data');
    clock.tick(510);
    assert.equal(
      progressEventCount,
      4,
      'No `onprogress` events are fired after the the request finalizes'
    );
  });

  it('no progress download events are fired after the request is aborted', function(
    assert
  ) {
    var progressEventCount = 0;
    clock = sinon.useFakeTimers();
    this.pretender.get(
      '/downloads',
      function(request) {
        return [200, {}, ''];
      },
      210
    );

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/downloads');
    xhr.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.send('some data');
    clock.tick(90);
    xhr.abort();
    clock.tick(220);
    assert.equal(
      progressEventCount,
      1,
      'only one progress event was triggered because the request was aborted'
    );
  });

  it('resolves cross-origin requests', function(assert) {
    var url = 'http://status.github.com/api/status';
    var payload = 'it works!';
    var wasCalled;

    this.pretender.get(url, function() {
      wasCalled = true;
      return [200, {}, payload];
    });

    $.ajax({ url: url });
    assert.ok(wasCalled);
  });

  it('accepts a handler that returns a promise', function(assert) {
    var done = assert.async();

    var json = '{foo: "bar"}';

    this.pretender.get('/some/path', function(req) {
      return new Promise(function(resolve) {
        resolve([200, {}, json]);
      });
    });

    this.pretender.handledRequest = function(verb, path, request) {
      assert.ok(true, 'handledRequest hook was called');
      assert.equal(verb, 'GET');
      assert.equal(path, '/some/path');
      assert.equal(request.responseText, json);
      assert.equal(request.status, '200');
      done();
    };

    $.ajax({ url: '/some/path' });
  });
});
