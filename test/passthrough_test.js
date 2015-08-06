var pretender;
module('pretender invoking', {
  setup: function() {
    pretender = new Pretender();
  },
  teardown: function() {
    if (pretender) {
      pretender.shutdown();
    }
    pretender = null;
  }
});

asyncTest('allows matched paths to be pass-through', function(assert) {
  pretender.post('/some/:route', pretender.passthrough);

  var passthroughInvoked = false;
  pretender.passthroughRequest = function(verb, path, request) {
    passthroughInvoked = true;
    assert.equal(verb, 'POST');
    assert.equal(path, '/some/path');
    assert.equal(request.requestBody, 'some=data');
  };

  $.ajax({
    url: '/some/path',
    method: 'POST',
    headers: {
      'test-header': 'value'
    },
    data: {
      some: 'data'
    },
    error: function(xhr) {
      assert.equal(xhr.status, 404);
      assert.ok(passthroughInvoked);
      QUnit.start();
    }
  });
});
