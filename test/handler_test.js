var describe = QUnit.module;
var it = QUnit.test;

describe('pretender invoking', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('get is called', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path'});
    ok(wasCalled);
  });

  it('post is called', function() {
    var wasCalled;

    this.pretender.post('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'post'});
    ok(wasCalled);
  });
  it('patch is called', function() {
    var wasCalled;

    this.pretender.patch('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'patch'});
    ok(wasCalled);
  });
  it('delete is called', function() {
    var wasCalled;

    this.pretender.delete('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'delete'});
    ok(wasCalled);
  });
  it('options is called', function() {
    var wasCalled;

    this.pretender.options('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'options'});
    ok(wasCalled);
  });
  it('put is called', function() {
    var wasCalled;

    this.pretender.put('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'put'});
    ok(wasCalled);
  });
  it('head is called', function() {
    var wasCalled;

    this.pretender.head('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path', method: 'head'});
    ok(wasCalled);
  });
});
