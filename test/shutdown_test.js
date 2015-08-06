var pretender, nativeXMLHttpRequest;
module('pretender shutdown', {
  setup: function() {
    nativeXMLHttpRequest = window.XMLHttpRequest;
  },
  shutdown: function() {
    pretender = nativeXMLHttpRequest = null;
  }
});

test('restores the native XMLHttpRequest object', function(assert) {
  pretender = new Pretender();
  assert.notEqual(window.XMLHttpRequest, nativeXMLHttpRequest);

  pretender.shutdown();
  assert.equal(window.XMLHttpRequest, nativeXMLHttpRequest);
});

test('warns if requests attempt to respond after shutdown', function(assert) {
  pretender = new Pretender();
  var request = new XMLHttpRequest();
  pretender.shutdown();

  assert.throws (function() {
    request.send();
  });
});
