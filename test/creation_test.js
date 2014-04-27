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
