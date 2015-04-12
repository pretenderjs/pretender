var registry;

module("Registry", {
  setup: function(){
    registry = new Pretender.Registry();
  }
});

test("has a 'verbs' property", function () {
	ok(registry.verbs);
});


test("supports all HTTP verbs", function () {
	var verbs = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
	for (var v = 0; v < verbs.length; v++) {
		ok(registry.verbs[verbs[v]], 'supports ' + verbs[v]);
	}
});
