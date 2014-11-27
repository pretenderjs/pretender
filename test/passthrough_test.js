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
  pretender.get('/some/:route', pretender.passthrough);

  var passthroughInvoked = false;
  pretender.passthroughRequest = function(verb, path, request) {
    passthroughInvoked = true;
    equal(verb, 'GET');
    equal(path, '/some/path');
  };

  $.ajax({
    url: '/some/path',
    headers: {
      'test-header': 'value'
    },
    error: function(xhr) {
      equal(xhr.status, 404);
      ok(passthroughInvoked);
      start();
    }
  });
});
