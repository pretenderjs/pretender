var describe = QUnit.module;
var it = QUnit.test;

describe('pretender invoking', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('a mapping function is optional', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path'});
    ok(wasCalled);
  });

  it('mapping can be called directly', function() {
    var wasCalled;
    function map() {
      this.get('/some/path', function() {
        wasCalled = true;
      });
    }

    this.pretender.map(map);

    $.ajax({url: '/some/path'});
    ok(wasCalled);
  });

  it('clobbering duplicate mapping works', function() {
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

    $.ajax({url: '/some/path'});

    ok(!wasCalled);
    ok(wasCalled2);
  });

  it('ordered duplicate mapping works', function() {
    var wasCalled, wasCalled2;
    function map() {
      this.get('/some/path', function() {
        wasCalled = true;
      });
    }

    this.pretender.map(map);
    $.ajax({url: '/some/path'});

    function map2() {
      this.get('/some/path', function() {
        wasCalled2 = true;
      });
    }

    this.pretender.map(map2);
    $.ajax({url: '/some/path'});

    ok(wasCalled);
    ok(wasCalled2);
  });

  it('params are passed', function() {
    var params;
    this.pretender.get('/some/path/:id', function(request) {
      params = request.params;
    });

    $.ajax({url: '/some/path/1'});
    equal(params.id, 1);
  });

  it('queryParams are passed', function() {
    var params;
    this.pretender.get('/some/path', function(request) {
      params = request.queryParams;
    });

    $.ajax({url: '/some/path?zulu=nation'});
    equal(params.zulu, 'nation');
  });

  it('request body is accessible', function() {
    var params;
    this.pretender.post('/some/path/1', function(request) {
      params = request.requestBody;
    });

    $.ajax({
      method: 'post',
      url: '/some/path/1',
      data: {
        ok: true
      }
    });
    equal(params, 'ok=true');
  });

  it('request headers are accessible', function() {
    var headers;
    this.pretender.post('/some/path/1', function(request) {
      headers = request.requestHeaders;
    });

    $.ajax({
      method: 'post',
      url: '/some/path/1',
      headers: {
        'A-Header': 'value'
      }
    });
    equal(headers['A-Header'], 'value');
  });

  it('adds requests to the list of handled requests', function() {
    var params;
    this.pretender.get('/some/path', function(request) {
      params = request.queryParams;
    });

    $.ajax({url: '/some/path'});

    var req = this.pretender.handledRequests[0];
    equal(req.url, '/some/path');
  });

  it('increments the handler\'s request count', function() {
    var handler = function(req) {};

    this.pretender.get('/some/path', handler);

    $.ajax({url: '/some/path'});

    equal(handler.numberOfCalls, 1);
  });

  it('handledRequest is called', function(assert) {
    var done = assert.async();

    var json = '{foo: "bar"}';
    this.pretender.get('/some/path', function(req) {
      return [200, {}, json];
    });

    this.pretender.handledRequest = function(verb, path, request) {
      ok(true, 'handledRequest hook was called');
      equal(verb, 'GET');
      equal(path, '/some/path');
      equal(request.responseText, json);
      equal(request.status, '200');
      done();
    };

    $.ajax({url: '/some/path'});
  });

  it('prepareBody is called', function(assert) {
    var done = assert.async();

    var obj = {foo: 'bar'};
    this.pretender.prepareBody = JSON.stringify;
    this.pretender.get('/some/path', function(req) {
      return [200, {}, obj];
    });

    $.ajax({
      url: '/some/path',
      success: function(resp) {
        deepEqual(JSON.parse(resp), obj);
        done();
      }
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
        equal(xhr.getResponseHeader('X-WAS-CALLED'), 'YES');
        done();
      }
    });
  });

  it('will use the latest defined handler', function() {
    expect(1);

    var latestHandlerWasCalled = false;
    this.pretender.get('/some/path', function(request) {
      ok(false);
    });
    this.pretender.get('/some/path', function(request) {
      latestHandlerWasCalled = true;
    });
    $.ajax({url: '/some/path'});
    ok(latestHandlerWasCalled, 'calls the latest handler');
  });

  it('will error when using fully qualified URLs instead of paths', function() {
    var pretender = this.pretender;

    pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    });

    throws(function() {
      pretender.handleRequest({url: 'http://myserver.com/some/path'});
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
        equal(val, 'set');
        done();
      }
    });

    equal(val, 'unset');
    val = 'set';
  });

  it('can be resolved synchronous', function() {
    var val = 0;

    this.pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    }, false);

    $.ajax({
      url: '/some/path',
      complete: function() {
        equal(val, 0);
        val++;
      }
    });

    equal(val, 1);
  });

  it('can be both asynchronous or synchronous based on an async function', function(assert) {
    var done = assert.async();

    var isAsync = false;
    var val = 0;

    this.pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    }, function() {
      return isAsync;
    });

    $.ajax({
      url: '/some/path',
      complete: function() {
        equal(val, 0);
        val++;
      }
    });

    equal(val, 1);
    val++;

    isAsync = 0;

    $.ajax({
      url: '/some/path',
      complete: function() {
        equal(val, 3);
        done();
      }
    });

    equal(val, 2);
    val++;
  });

  it('can be configured to resolve after a specified time', function(assert) {
    var done = assert.async();

    var val = 0;

    this.pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    }, 100);

    $.ajax({
      url: '/some/path',
      complete: function() {
        equal(val, 1);
        done();
      }
    });

    setTimeout(function() {
      equal(val, 0);
      val++;
    }, 0);
  });

  it('can be configured to require manually resolution', function() {
    var val = 0;
    var req = $.ajaxSettings.xhr();

    this.pretender.get('/some/path', function(request) {
      return [200, {}, ''];
    }, true);

    $.ajax({
      url: '/some/path',
      xhr: function() {
        // use the xhr we already made and have a reference to
        return req;
      },
      complete: function() {
        equal(val, 1);
        val++;
      }
    });

    equal(val, 0);
    val++;

    this.pretender.resolve(req);

    equal(val, 2);
  });

  it('requiresManualResolution returns true for endpoints configured with `true` for async', function() {
    this.pretender.get('/some/path', function(request) {}, true);
    this.pretender.get('/some/other/path', function() {});

    ok(this.pretender.requiresManualResolution('get', '/some/path'));
    ok(!this.pretender.requiresManualResolution('get', '/some/other/path'));
  });

  it('async requests with `onprogress` upload events in the upload ' +
    ' trigger a progress event each 50ms', function(assert) {
    var done = assert.async();
    var progressEventCount = 0;
    this.pretender.post('/uploads', function(request) {
      return [200, {}, ''];
    }, 300);

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/uploads');
    xhr.upload.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.onload = function() {
      equal(progressEventCount, 5, 'In a request of 300ms the progress event has been fired 5 times');
      done();
    };
    xhr.send('some data');
  });

  it('`onprogress` upload events don\'t keep firing once the request has ended', function(assert) {
    var done = assert.async();
    var progressEventCount = 0;
    this.pretender.post('/uploads', function(request) {
      return [200, {}, ''];
    }, 210);

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/uploads');
    xhr.upload.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.send('some data');
    setTimeout(function() {
      equal(progressEventCount, 4, 'No `onprogress` events are fired after the the request finalizes');
      done();
    }, 510);
  });

  it('no progress upload events are fired after the request is aborted', function(assert) {
    var done = assert.async();
    var progressEventCount = 0;

    this.pretender.post('/uploads', function(request) {
      return [200, {}, ''];
    }, 210);

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/uploads');
    xhr.upload.onprogress = function(e) { progressEventCount++; };
    xhr.send('some data');
    setTimeout(function() { xhr.abort(); }, 90);
    setTimeout(function() {
      equal(progressEventCount, 1, 'only one progress event was triggered because the request was aborted');
      done();
    }, 220);
  });

  it('async requests with `onprogress` events trigger a progress event each 50ms', function(assert) {
    var done = assert.async();
    var progressEventCount = 0;
    this.pretender.get('/downloads', function(request) {
      return [200, {}, ''];
    }, 300);

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/downloads');
    xhr.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.onload = function() {
      equal(progressEventCount, 5, 'In a request of 300ms the progress event has been fired 5 times');
      done();
    };
    xhr.send('some data');
  });

  it('`onprogress` download events don\'t keep firing once the request has ended', function(assert) {
    var done = assert.async();
    var progressEventCount = 0;
    this.pretender.get('/downloads', function(request) {
      return [200, {}, ''];
    }, 210);

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/downloads');
    xhr.onprogress = function(e) {
      progressEventCount++;
    };
    xhr.send('some data');
    setTimeout(function() {
      equal(progressEventCount, 4, 'No `onprogress` events are fired after the the request finalizes');
      done();
    }, 510);
  });

  it('no progress download events are fired after the request is aborted', function(assert) {
    var done = assert.async();
    var progressEventCount = 0;

    this.pretender.get('/downloads', function(request) {
      return [200, {}, ''];
    }, 210);

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/downloads');
    xhr.onprogress = function(e) { progressEventCount++; };
    xhr.send('some data');
    setTimeout(function() { xhr.abort(); }, 90);
    setTimeout(function() {
      equal(progressEventCount, 1, 'only one progress event was triggered because the request was aborted');
      done();
    }, 220);
  });

  it('resolves cross-origin requests', function() {

    var url = 'http://status.github.com/api/status';
    var payload = 'it works!';
    var wasCalled;

    this.pretender.get(url, function() {
      wasCalled = true;
      return [200, {}, payload];
    });

    $.ajax({url: url});
    ok(wasCalled);
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
      ok(true, 'handledRequest hook was called');
      equal(verb, 'GET');
      equal(path, '/some/path');
      equal(request.responseText, json);
      equal(request.status, '200');
      done();
    };

    $.ajax({url: '/some/path'});
  });
});

