var pretender;
module("pretender invoking", {
  setup: function(){
    pretender = new Pretender();
  },
  teardown: function(){
    pretender && pretender.shutdown();
    pretender = null;
  }
});

test("retruns empty endpoint list", function(){
  var endpoints = pretender.endpoints(); 
  equal(endpoints.length, 0);
});
test("retruns endpoint list", function(){
  var wasCalled = false;
  pretender.get('/some/path/1', function(){
    wasCalled = true;
  });
  pretender.post('/some/path', function(){
    wasCalled = true;
  });
  equal(wasCalled, false);
  var endpoints = pretender.endpoints(); 
  equal(endpoints.length, 2, 'number of endpoints');
  var get = endpoints[0];
  var post = endpoints[1];
  equal(get.verb, 'GET');
  equal(get.path, '/some/path/1');
  equal(post.verb, 'POST');
  equal(post.path, '/some/path');
});
