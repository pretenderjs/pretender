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
  pretender.get('/assets/pretender.ogg', pretender.passthrough);

  var passthroughInvoked = false;
  pretender.passthroughRequest = function(verb, path, request) {
    passthroughInvoked = true;
    equal(verb, 'GET');
    equal(path, '/assets/pretender.ogg');
    equal(request.requestBody);
  };

  $.ajax({
    url: '/assets/pretender.ogg',
    method: 'GET',
    headers: {
      'test-header': 'value',
    },
    success: function(data, status, xhr){
      equal(xhr.status, 404);
      ok(passthroughInvoked);
      start();
    }
  });
});
