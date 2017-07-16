var nativeXMLHttpRequest;
var describe = QUnit.module;
var it = QUnit.test;

describe('pretender shutdown', function(config) {
  config.beforeEach(function() {
    nativeXMLHttpRequest = window.XMLHttpRequest;
  });

  config.afterEach(function() {
    nativeXMLHttpRequest = null;
  });

  it('restores the native XMLHttpRequest object', function(assert) {
    var pretender = new Pretender();
    assert.notEqual(window.XMLHttpRequest, nativeXMLHttpRequest);

    pretender.shutdown();
    assert.equal(window.XMLHttpRequest, nativeXMLHttpRequest);
  });

  it('warns if requests attempt to respond after shutdown', function(assert) {
    var pretender = new Pretender();
    var request = new XMLHttpRequest();
    pretender.shutdown();

    assert.throws(function() {
      request.send();
    });
  });
});
