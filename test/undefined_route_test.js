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
  };

  $.ajax({
    url: 'not-defined'
  });
});

test("errors by default", function(){
  var verb = 'GET', path = '/foo/bar';
  throws( function() {
    pretender.unhandledRequest(verb, path);
  }, 'Pretender intercepted GET /foo/bar but no handler was defined for this type of request');
});

test("adds the request to the array of unhandled requests by default", function(){
  $.ajax({
    url: 'not-defined'
  });

  var req = pretender.unhandledRequests[0];
  equal(req.url, 'not-defined');
});
