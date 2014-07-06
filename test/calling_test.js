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
