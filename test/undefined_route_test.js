var pretender;
module("pretender route not defined", {
  setup: function(){
    pretender = new Pretender();
  },
  teardown: function(){
    pretender && pretender.shutdown();
    pretender = null;
  }
});

test("calls unhandledRequest", function(){
  pretender.unhandledRequest = function(verb, path){
    equal('GET', verb);
    equal('not-defined', path);
    ok(true);
  }

  $.ajax({
    url: 'not-defined'
  });
});

test("errors by default", function(){
  var verb = 'GET', path = '/foo/bar'
  throws( function() {
    pretender.unhandledRequest(verb, path);
  }, 'Pretender intercepted GET /foo/bar but no handler was defined for this type of request');
});

asyncTest("can pass through to the native XMLHTTPRequest object if passthroughUnhandledRequests", function(){
  var verb = 'GET', path = '/foo/bar';
  pretender.passthroughUnhandledRequests = true;
  var request = new window.XMLHttpRequest();
  request.onload = function(data){
    start();
    equal(this.status, 404);
  };
  request.open(verb, path, true);
  request.send();
});