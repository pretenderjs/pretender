import PretenderES from '../src/pretender.es';
let pretender;
let describe = QUnit.module;
let it = QUnit.test;

describe('pretender as a module', function(config) {

  let FakeFetch;
  let FakeXMLHttpRequest;
  let RouteRecognizer;

  config.before(function() {
    // Make sure it isn't relying on the environment set up
    // by Karma for the other tests.
    FakeFetch = window.FakeFetch;
    window.FakeFetch = null;

    FakeXMLHttpRequest = window.FakeXMLHttpRequest;
    window.FakeXMLHttpRequest = null;

    RouteRecognizer = window.RouteRecognizer;
    window.RouteRecognizer = null;
  });

  config.after(function() {
    window.FakeFetch = FakeFetch;
    window.FakeXMLHttpRequest = FakeXMLHttpRequest;
    window.RouteRecognizer = RouteRecognizer;
  });

  config.afterEach(function() {
    if (pretender) {
      pretender.shutdown();
    }
    pretender = null;
  });

  it('creates an instance', function(assert) {
    try {
      pretender = new PretenderES();
    } catch (e) {
      assert.ok(false);
    }

    assert.ok(true, 'does not raise');
  });

});