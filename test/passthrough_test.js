var originalXMLHttpRequest;
var describe = QUnit.module;
var it = QUnit.test;

describe('passthrough requests', function(config) {
  config.beforeEach(function() {
    originalXMLHttpRequest = window.XMLHttpRequest;
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
    window.XMLHttpRequest = originalXMLHttpRequest;
  });

  it('allows matched paths to be pass-through', function(assert) {
    var pretender = this.pretender;
    var done = assert.async();

    pretender.post('/some/:route', pretender.passthrough);

    var passthroughInvoked = false;
    pretender.passthroughRequest = function(verb, path, request) {
      passthroughInvoked = true;
      assert.equal(verb, 'POST');
      assert.equal(path, '/some/path');
      assert.equal(request.requestBody, 'some=data');
    };

    $.ajax({
      url: '/some/path',
      method: 'POST',
      headers: {
        'test-header': 'value',
      },
      data: {
        some: 'data',
      },
      error: function(xhr) {
        assert.equal(xhr.status, 404);
        assert.ok(passthroughInvoked);
        done();
      },
    });
  });

  it('passthrough request calls jQuery v1 handler', function(assert) {
    var pretender = this.pretender;
    var done = assert.async();

    var jQuery2 = jQuery.noConflict(true);
    pretender.get('/some/:route', pretender.passthrough);

    assert.ok(/^1/.test(jQuery.fn.jquery));
    jQuery.ajax({
      url: '/some/path',
      error: function(xhr) {
        assert.equal(xhr.status, 404);
        jQuery = $ = jQuery2;
        assert.ok(/^2/.test(jQuery.fn.jquery));
        done();
      },
    });
  });

  it(
    'asynchronous request with pass-through has timeout,' +
      'withCredentials and onprogress event',
    function(assert) {
      var pretender = this.pretender;
      var done = assert.async();

      function testXHR() {
        this.pretender = pretender;
        this.open = function() {};
        this.setRequestHeader = function() {};
        this.upload = {};
        this.send = {
          pretender: pretender,
          apply: function(xhr, argument) {
            assert.ok('timeout' in xhr);
            assert.ok('withCredentials' in xhr);
            assert.ok('onprogress' in xhr);
            this.pretender.resolve(xhr);
            done();
          },
        };
      }
      pretender._nativeXMLHttpRequest = testXHR;

      pretender.post('/some/path', pretender.passthrough);

      var xhr = new window.XMLHttpRequest();
      xhr.open('POST', '/some/path');
      xhr.timeout = 1000;
      xhr.withCredentials = true;
      xhr.send('some data');
    }
  );

  it(
    'asynchronous request with pass-through and ' +
      'arraybuffer as responseType',
    function(assert) {
      var pretender = this.pretender;
      var done = assert.async();

      function testXHR() {
        this.pretender = pretender;
        this.open = function() {};
        this.setRequestHeader = function() {};
        this.upload = {};
        this.responseType = '';
        this.send = {
          pretender: pretender,
          apply: function(xhr, argument) {
            assert.equal(xhr.responseType, 'arraybuffer');
            this.pretender.resolve(xhr);
            done();
          },
        };
      }
      pretender._nativeXMLHttpRequest = testXHR;

      pretender.get('/some/path', pretender.passthrough);

      var xhr = new window.XMLHttpRequest();
      xhr.open('GET', '/some/path');
      xhr.responseType = 'arraybuffer';
      xhr.send();
    }
  );

  it('synchronous request does not have timeout, withCredentials and onprogress event', function(
    assert
  ) {
    var pretender = this.pretender;
    var done = assert.async();

    function testXHR() {
      this.open = function() {};
      this.setRequestHeader = function() {};
      this.upload = {};
      this.send = {
        pretender: pretender,
        apply: function(xhr, argument) {
          assert.ok(!('timeout' in xhr));
          assert.ok(!('withCredentials' in xhr));
          assert.ok(!('onprogress' in xhr));
          this.pretender.resolve(xhr);
          done();
        },
      };
    }
    pretender._nativeXMLHttpRequest = testXHR;

    pretender.post('/some/path', pretender.passthrough);

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/some/path', false);
    xhr.timeout = 1000;
    xhr.withCredentials = true;
    xhr.send('some data');
  });

  it('asynchronous request fires events', function(assert) {
    assert.expect(6);

    var pretender = this.pretender;
    var done = assert.async();

    pretender.post('/some/:route', pretender.passthrough);

    var onEvents = {
      load: false,
      progress: false,
      readystatechange: false,
    };
    var listenerEvents = {
      load: false,
      progress: false,
      readystatechange: false,
    };

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/some/otherpath');

    xhr.addEventListener('progress', function _progress() {
      listenerEvents.progress = true;
    });

    xhr.onprogress = function _onprogress() {
      onEvents.progress = true;
    };

    xhr.addEventListener('load', function _load() {
      listenerEvents.load = true;
      finishNext();
    });

    xhr.onload = function _onload() {
      onEvents.load = true;
      finishNext();
    };

    xhr.addEventListener('readystatechange', function _load() {
      if (xhr.readyState == 4) {
        listenerEvents.readystatechange = true;
        finishNext();
      }
    });

    xhr.onreadystatechange = function _onload() {
      if (xhr.readyState == 4) {
        onEvents.readystatechange = true;
        finishNext();
      }
    };

    xhr.send();

    // call `finish` in next tick to ensure both load event handlers
    // have a chance to fire.
    function finishNext() {
      setTimeout(finishOnce, 1);
    }

    var finished = false;
    function finishOnce() {
      if (!finished) {
        finished = true;

        assert.ok(onEvents.load, 'onload called');
        assert.ok(onEvents.progress, 'onprogress called');
        assert.ok(onEvents.readystatechange, 'onreadystate called');

        assert.ok(listenerEvents.load, 'load listener called');
        assert.ok(listenerEvents.progress, 'progress listener called');
        assert.ok(
          listenerEvents.readystatechange,
          'readystate listener called'
        );

        done();
      }
    }
  });

  it('asynchronous request fires upload progress events', function(assert) {
    assert.expect(2);

    var pretender = this.pretender;
    var done = assert.async();

    pretender.post('/some/:route', pretender.passthrough);

    var onEvents = {
      progress: false,
    };
    var listenerEvents = {
      progress: false,
    };

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', '/some/otherpath');

    xhr.upload.addEventListener('progress', function _progress() {
      listenerEvents.progress = true;
    });

    xhr.upload.onprogress = function _onprogress() {
      onEvents.progress = true;
    };

    xhr.onload = function _onload() {
      setTimeout(finish, 1);
    };

    xhr.send('some data');

    // ensure the test ends
    var failTimer = setTimeout(function() {
      assert.ok(false, 'test timed out');
      done();
    }, 500);

    var finished = false;
    function finish() {
      if (!finished) {
        finished = true;
        clearTimeout(failTimer);
        assert.ok(onEvents.progress, 'onprogress called');
        assert.ok(listenerEvents.progress, 'progress listener called');

        done();
      }
    }
  });

  it('asynchronous request with pass-through and empty response', function(
    assert
  ) {
    var done = assert.async();
    var pretender = this.pretender;

    function testXHR() {
      this.pretender = pretender;
      this.open = function() {};
      this.setRequestHeader = function() {};
      this.responseText = '';
      this.onload = true;
      this.send = {
        pretender: pretender,
        apply: function(xhr, argument) {
          xhr.onload({ target: xhr, type: 'load' });
        },
      };
    }
    pretender._nativeXMLHttpRequest = testXHR;

    pretender.get('/some/path', pretender.passthrough);

    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', '/some/path');
    xhr.addEventListener('load', function _onload(event) {
      assert.equal(
        xhr.responseText,
        event.target.responseText,
        'responseText for real and fake xhr are both blank strings'
      );
      done();
    });

    xhr.send();
  });
});
