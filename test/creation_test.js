var pretender;
module("pretender creation", {
  teardown: function(){
    pretender && pretender.shutdown();
    pretender = null;
  }
});

test("a mapping function is optional", function(){
  var result = false;
  try {
    pretender = new Pretender();
    result = true;
  } catch (e) {
    // fail
  }

  ok(true, "does not raise");
});

test("an error is thrown when a request handler is missing", function(){
  throws(function(){
    pretender = new Pretender();
    pretender.get('/path', undefined);
  }, "The function you tried passing to Pretender to handle GET /path is undefined or missing.");
});
