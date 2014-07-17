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

test("handledRequest is called", function(){
  pretender.get('/some/path', function(){});
  pretender.handledRequest = function(){
    ok(true, "handledRequest hook was called");
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

test("recognizes cross domain requests", function(){
  var wasCalled;
  var wasNotCalled = true;
  pretender.get('http://some-other-domain.com/some/path', function() {
    wasCalled = true;
  });
  pretender.get('/some/path', function() {
    wasNotCalled = false;
  });

  $.ajax({url: 'http://some-other-domain.com/some/path'});

  ok(wasCalled);
  ok(wasNotCalled);
});
