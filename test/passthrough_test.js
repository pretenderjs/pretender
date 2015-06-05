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
asyncTest("allows matched paths to be pass-through", function(){
  pretender.post('/some/:route', pretender.passthrough);

  var passthroughInvoked = false;
  pretender.passthroughRequest = function(verb, path, request) {
    passthroughInvoked = true;
    equal(verb, 'POST');
    equal(path, '/some/path');
    equal(request.requestBody, 'some=data');
  };

  $.ajax({
    url: '/some/path',
    method: 'POST',
    headers: {
      'test-header': 'value'
    },
    data: {
      'some': 'data'
    },
    error: function(xhr) {
      equal(xhr.status, 404);
      ok(passthroughInvoked);
      start();
    }
  });
});

asyncTest("allows requests for URL to be pass-through", function(){
  pretender.passthroughURL = true;

  var passthroughInvoked = false;
  pretender.passthroughRequest = function(verb, path, request) {
    passthroughInvoked = true;
    equal(verb, 'POST');
    equal(path, 'http://www.google.com');
    equal(request.requestBody, 'some=data');
  };

  $.ajax({
    url: 'http://www.google.com',
    method: 'POST',
    headers: {
      'test-header': 'value'
    },
    data: {
      'some': 'data'
    },
    async: false,
    error: function(xhr) {
      equal(xhr.status, 0);
      ok(passthroughInvoked);
      start();
    }
  });
});


