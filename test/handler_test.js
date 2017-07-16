var describe = QUnit.module;
var it = QUnit.test;

describe('pretender adding a handler', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('a handler is returned', function(assert) {
    var handler = this.pretender.get('/some/path', function() {});
    assert.ok(handler);
  });

  it('.get registers a handler for GET', function(assert) {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path' });
    assert.ok(wasCalled);
  });

  it('.post registers a handler for POST', function(assert) {
    var wasCalled;

    this.pretender.post('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path', method: 'post' });
    assert.ok(wasCalled);
  });

  it('.patch registers a handler for PATCH', function(assert) {
    var wasCalled;

    this.pretender.patch('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path', method: 'patch' });
    assert.ok(wasCalled);
  });

  it('.delete registers a handler for DELETE', function(assert) {
    var wasCalled;

    this.pretender.delete('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path', method: 'delete' });
    assert.ok(wasCalled);
  });

  it('.options registers a handler for OPTIONS', function(assert) {
    var wasCalled;

    this.pretender.options('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path', method: 'options' });
    assert.ok(wasCalled);
  });

  it('.put registers a handler for PUT', function(assert) {
    var wasCalled;

    this.pretender.put('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path', method: 'put' });
    assert.ok(wasCalled);
  });

  it('.head registers a handler for HEAD', function(assert) {
    var wasCalled;

    this.pretender.head('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({ url: '/some/path', method: 'head' });
    assert.ok(wasCalled);
  });
});
