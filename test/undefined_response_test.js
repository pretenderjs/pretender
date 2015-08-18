var pretender;
module('pretender undefined response', {
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

test('calls erroredRequest', function(assert) {
  pretender.get('/some/path', function() {
    // return nothing
  });

  pretender.erroredRequest = function(verb, path, request, error) {
    var message = 'Nothing returned by handler for ' + path + '. ' +
      'Remember to `return [status, headers, body];` in your route handler.';
    assert.equal(error.message, message);
  };

  $.ajax({url: '/some/path'});
});

