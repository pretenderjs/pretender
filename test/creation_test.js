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

test("many maps can be passed on creation", function(){
  var aWasCalled = false;
  var bWasCalled = false;

  var mapA = function(){
    this.get('/some/path', function(){
      aWasCalled = true
    })
  };

  var mapB = function(){
    this.get('/other/path', function(){
      bWasCalled = true
    })
  };

  pretender = new Pretender(mapA, mapB);

  $.ajax({url: '/some/path'});
  $.ajax({url: '/other/path'});

  ok(aWasCalled);
  ok(bWasCalled);
});

test("an error is thrown when a request handler is missing", function(){
  throws(function(){
    pretender = new Pretender();
    pretender.get('/path', undefined);
  }, "The function you tried passing to Pretender to handle GET /path is undefined or missing.");
});
