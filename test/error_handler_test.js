var pretender;
module('pretender errored requests', {
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
    throw new Error('something in this handler broke!');
  });

  pretender.erroredRequest = function(verb, path, request, error) {
    assert.ok(error);
  };

  $.ajax({url: '/some/path'});
});

