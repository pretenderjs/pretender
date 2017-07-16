var describe = QUnit.module;
var it = QUnit.test;

describe('pretender', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender({ trackRequests: false });
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('does not track handled requests', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path'});

    ok(wasCalled);
    equal(this.pretender.handledRequests.length, 0);
    equal(this.pretender.unhandledRequests.length, 0);
    equal(this.pretender.passthroughRequests.length, 0);
  });

  it('does not track unhandled requests requests', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/very/good'});

    notOk(wasCalled);
    equal(this.pretender.handledRequests.length, 0);
    equal(this.pretender.unhandledRequests.length, 0);
    equal(this.pretender.passthroughRequests.length, 0);
  });

  it('does not track passthrough requests requests', function() {
    var wasCalled;

    this.pretender.passthrough = function() {
      wasCalled = true;
    };

    this.pretender.get('/some/path', this.pretender.passthrough);

    $.ajax({url: '/some/path'});

    ok(wasCalled);
    equal(this.pretender.handledRequests.length, 0);
    equal(this.pretender.unhandledRequests.length, 0);
    equal(this.pretender.passthroughRequests.length, 0);
  });

});

describe('pretender', function(config) {
  config.beforeEach(function() {
    this.pretender = new Pretender();
  });

  config.afterEach(function() {
    this.pretender.shutdown();
  });

  it('tracks handled requests', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/some/path'});

    ok(wasCalled);
    equal(this.pretender.handledRequests.length, 1);
    equal(this.pretender.unhandledRequests.length, 0);
    equal(this.pretender.passthroughRequests.length, 0);
  });

  it('tracks unhandled requests requests', function() {
    var wasCalled;

    this.pretender.get('/some/path', function() {
      wasCalled = true;
    });

    $.ajax({url: '/very/good'});

    notOk(wasCalled);
    equal(this.pretender.handledRequests.length, 0);
    equal(this.pretender.unhandledRequests.length, 1);
    equal(this.pretender.passthroughRequests.length, 0);
  });

  it('tracks passthrough requests requests', function() {
    var wasCalled;

    this.pretender.passthroughRequest = function() {
      wasCalled = true;
    };

    this.pretender.get('/some/path', this.pretender.passthrough);

    $.ajax({url: '/some/path'});

    ok(wasCalled);
    equal(this.pretender.handledRequests.length, 0);
    equal(this.pretender.unhandledRequests.length, 0);
    equal(this.pretender.passthroughRequests.length, 1);
  });

});

