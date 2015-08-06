var pretender;
module('pretender route not defined', {
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

test('calls unhandledRequest', function(assert) {
  pretender.unhandledRequest = function(verb, path) {
    assert.equal('GET', verb);
    assert.equal('not-defined', path);
    assert.ok(true);
  };

  $.ajax({
    url: 'not-defined'
  });
});

test('errors by default', function(assert) {
  var verb = 'GET';
  var path = '/foo/bar';
  assert.throws (function() {
    pretender.unhandledRequest(verb, path);
  }, 'Pretender intercepted GET /foo/bar but no handler was defined for this type of request');
});

test('adds the request to the array of unhandled requests by default', function(assert) {
  $.ajax({
    url: 'not-defined'
  });

  var req = pretender.unhandledRequests[0];
  assert.equal(req.url, 'not-defined');
});
