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
    // equal(request.responseType, 'arraybuffer');
    equal(request.response);
    console.log(request.response);
  };

  var xhr = new XMLHttpRequest();
  xhr.open("GET", '/assets/pretender.ogg', true );
  // important because this allow to load the binary data correctly, it makes the response available which contains the arraybuffer
  xhr.responseType = 'arraybuffer';
  xhr.onload = function ()
  {
    ok(xhr.response);
    equal(xhr.response.constructor, ArrayBuffer);
    equal(xhr.status, 200);
    ok(passthroughInvoked);
    start();
  };
  xhr.send( null );
});
