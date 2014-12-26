var pretender;
module("pretender invoking", {
  setup: function(){
    pretender = new Pretender();
  },
  teardown: function(){
    pretender && pretender.shutdown();
    pretender = null;
  }
});

test("a mapping function is optional", function(){
  var wasCalled;

  pretender.get('/some/path', function(){
    wasCalled = true;
  });

  $.ajax({url: '/some/path'});
  ok(wasCalled);
});

test("params are passed", function(){
  var params;
  pretender.get('/some/path/:id', function(request){
    params = request.params;
  });

  $.ajax({url: '/some/path/1'});
  equal(params.id, 1);
});

test("queryParams are passed", function(){
  var params;
  pretender.get('/some/path', function(request){
    params = request.queryParams;
  });

  $.ajax({url: '/some/path?zulu=nation'});
  equal(params.zulu, 'nation');
});

test("adds requests to the list of handled requests", function(){
  var params;
  pretender.get('/some/path', function(request){
    params = request.queryParams;
  });

  $.ajax({url: '/some/path'});

  var req = pretender.handledRequests[0];
  equal(req.url, '/some/path');
});

test("increments the handler's request count", function(){
  var handler = function(req){};

  pretender.get('/some/path', handler);

  $.ajax({url: '/some/path'});

  equal(handler.numberOfCalls, 1);
});

test("handledRequest is called", function(assert){
  var done = assert.async();

  var json = "{foo: 'bar'}";
  pretender.get('/some/path', function(req){
    return [200, {}, json];
  });

  pretender.handledRequest = function(verb, path, request){
    ok(true, "handledRequest hook was called");
    equal(verb, "GET");
    equal(path, "/some/path");
    equal(request.responseText, json);
    equal(request.status, "200");
    done();
  };

  $.ajax({url: '/some/path'});
});

test("prepareBody is called", function(assert){
  var done = assert.async();

  var obj = {foo: 'bar'};
  pretender.prepareBody = JSON.stringify;
  pretender.get('/some/path', function(req){
    return [200, {}, obj];
  });

  $.ajax({
    url: '/some/path',
    success: function(resp){
      deepEqual(JSON.parse(resp), obj);
      done();
    }
  });
});

test("prepareHeaders is called", function(assert){
  var done = assert.async();

  pretender.prepareHeaders = function(headers){
    headers['X-WAS-CALLED'] = 'YES';
    return headers;
  };

  pretender.get('/some/path', function(req){
    return [200, {}, ''];
  });

  $.ajax({
    url: '/some/path',
    complete: function(xhr){
      equal(xhr.getResponseHeader('X-WAS-CALLED'), 'YES');
      done();
    }
  });
});

test("will use the latest defined handler", function(){
  expect(1);
  var latestHandlerWasCalled = false;
  pretender.get('/some/path', function(request){
    ok(false);
  });
  pretender.get('/some/path', function(request){
    latestHandlerWasCalled = true
  });
  $.ajax({url: '/some/path'});
  ok(latestHandlerWasCalled, 'calls the latest handler');
});

test("will error when using fully qualified URLs instead of paths", function(){
  pretender.get('/some/path', function(request){
    return [200, {}, ''];
  });

  throws(function(){
    pretender.handleRequest({url: 'http://myserver.com/some/path'});
  });

});

test("is resolved asynchronously", function(assert){
  var done = assert.async();
  var val = 'unset';

  pretender.get('/some/path', function(request){
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

test("can be resolved synchronous", function() {
  var val = 0;

  pretender.get('/some/path', function(request){
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

test("can be both asynchronous or synchronous based on an async function", function(assert) {
  var done = assert.async();

  var isAsync = false;
  var val = 0;

  pretender.get('/some/path', function(request) {
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

test("can be configured to resolve after a specified time", function(assert) {
  var done = assert.async();

  var val = 0;

  pretender.get('/some/path', function(request) {
    return [200, {}, ''];
  }, 10);

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

test("can be configured to require manually resolution", function() {
  var val = 0;
  var req = $.ajaxSettings.xhr();

  pretender.get('/some/path', function(request) {
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

  pretender.resolve(req);

  equal(val, 2);
});

test("requiresManualResolution returns true for endpoints configured with `true` for async", function() {
  pretender.get('/some/path', function(request) {}, true);
  pretender.get('/some/other/path', function() {});

  ok(pretender.requiresManualResolution('get', '/some/path'));
  ok(!pretender.requiresManualResolution('get', '/some/other/path'));
});