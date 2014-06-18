var pretender;


test("allows matched paths to be pass-through", function(){
  var server = new Pretender(function(){
    this.get('/some/path', this.passthrough);
  });

  $.ajax({url: '/some/path'});

  var req = server.handledRequests[0];
  equal(req.url, '/some/path');
  equal(req.requestHeaders['X-Requested-With'], 'XMLHttpRequest')
});
