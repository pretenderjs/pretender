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

asyncTest("handledRequest is called", function(){
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
    QUnit.start();
  };

  $.ajax({url: '/some/path'});
});

test("prepareBody is called", function(){
  var obj = {foo: 'bar'};
  pretender.prepareBody = JSON.stringify;
  pretender.get('/some/path', function(req){
    return [200, {}, obj];
  });

  $.ajax({
    url: '/some/path',
    success: function(resp){
      deepEqual(JSON.parse(resp), obj);
    }
  });
});

asyncTest("prepareHeaders is called", function(){
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
      QUnit.start();
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
