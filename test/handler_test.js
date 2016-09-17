var describe = QUnit.module;
var it = QUnit.test;

describe('pretender adding a handler', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('a handler is returned', function() {
    var handler = this.pretender.get('/some/path', function() {});
    ok(handler);
  });

  it('.get registers a handler for GET', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path'});
    ok(wasCalled);
  });

  it('.post registers a handler for POST', function() {
    var wasCalled;

    this.pretender.post('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'post'});
    ok(wasCalled);
  });

  it('.patch registers a handler for PATCH', function() {
    var wasCalled;

    this.pretender.patch('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'patch'});
    ok(wasCalled);
  });

  it('.delete registers a handler for DELETE', function() {
    var wasCalled;

    this.pretender.delete('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'delete'});
    ok(wasCalled);
  });

  it('.options registers a handler for OPTIONS', function() {
    var wasCalled;

    this.pretender.options('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'options'});
    ok(wasCalled);
  });

  it('.put registers a handler for PUT', function() {
    var wasCalled;

    this.pretender.put('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'put'});
    ok(wasCalled);
  });

  it('.head registers a handler for HEAD', function() {
    var wasCalled;

    this.pretender.head('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'head'});
    ok(wasCalled);
  });
});
