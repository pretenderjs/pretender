var pretender, nativeXMLHttpRequest;
module("pretender shutdown", {
  setup: function(){
    nativeXMLHttpRequest = window.XMLHttpRequest;
  },
  shutdown: function(){
    pretender = nativeXMLHttpRequest = null;
  }
});

test("restores the native XMLHttpRequest object", function(){
  pretender = new Pretender();
  notEqual(window.XMLHttpRequest, nativeXMLHttpRequest);

  pretender.shutdown();
  equal(window.XMLHttpRequest, nativeXMLHttpRequest);
});

test("warns if requests attempt to respond after shutdown", function(){
  pretender = new Pretender();
  var request = new XMLHttpRequest();
  pretender.shutdown();

  throws( function() {
    request.send();
  });
});