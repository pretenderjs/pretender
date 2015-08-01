var hosts;

module("Hosts", {
  setup: function(){
    hosts = new Pretender.Hosts();
  }
});

test("forURL - returns a registry for a URL", function () {
	ok(hosts.forURL('http://www.groupon.com/offers/skydiving'));
});

test("forURL - returns a registry for a relative path", function () {
	ok(hosts.forURL('/offers/skydiving'));
});

test("forURL - returns different Registry objects for different hosts ", function () {
	var registry1 = hosts.forURL('/offers/dinner_out');
	var registry2 = hosts.forURL('http://www.yahoo.com/offers/dinner_out');
	registry1['GET'].add({
		path: 'http://www.yahoo.com/offers/dinner_out',
		handler: function () {
			return [200, {}, 'ok'];
		}
	});
	ok(!registry2['GET'].recognize('http://www.yahoo.com/offers/dinner_out'));
	ok(!registry1['GET'].recognize('http://www.yahoo.com/offers/dinner_out'));
});

