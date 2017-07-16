var hosts;
var describe = QUnit.module;
var it = QUnit.test;

describe('Hosts', function(config) {
  config.beforeEach(function() {
    hosts = new Pretender.Hosts();
  });

  config.afterEach(function() {
    hosts = undefined;
  });

  describe('#forURL', function() {
    it('returns a registry for a URL', function(assert) {
      assert.ok(hosts.forURL('http://www.groupon.com/offers/skydiving'));
    });

    it('returns a registry for a relative path', function(assert) {
      assert.ok(hosts.forURL('/offers/skydiving'));
    });

    it('returns different Registry objects for different hosts ', function(
      assert
    ) {
      var registry1 = hosts.forURL('/offers/dinner_out');
      var registry2 = hosts.forURL('http://www.yahoo.com/offers/dinner_out');
      registry1.GET.add({
        path: 'http://www.yahoo.com/offers/dinner_out',
        handler: function() {
          return [200, {}, 'ok'];
        },
      });
      assert.ok(
        !registry2.GET.recognize('http://www.yahoo.com/offers/dinner_out')
      );
      assert.ok(
        !registry1.GET.recognize('http://www.yahoo.com/offers/dinner_out')
      );
    });
  });
});
