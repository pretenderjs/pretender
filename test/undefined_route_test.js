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

test("errors the response", function(){
  $.ajax({
    url: 'not-defined',
    error: function(xhr, status, text){
      equal(text, "Not Found");
      equal(status, "error");
      ok(true, "calls 404");
    }
  })
});
