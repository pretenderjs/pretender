module('json helper');

var json = Pretender.json;

test('is present', function() {
  ok(json, 'json helper is available');
});

test('accepts and returns error code', function() {
  var success = json(200, {})();
  var notFound = json(404, {})();
  equal(success[0], 200, 'passing status code 200 returns 200 as status code');
  equal(notFound[0], 404, 'passing status code 404 returns 404 as status code');
});

test('response is stringified', function() {
  var response = { foo: 'bar' };
  var success = json(200, response)();

  notEqual(success[2], response, 'return value doesn\'t equal to passed in object');
  equal(success[2], '{"foo":"bar"}', 'response is a string');
});

test('encoding is always json', function() {
  var success = json(200, { foo: 'bar'});

  equal(success()[1]['Content-Type'], 'text/json', 'Content Type is set to text/json');
});
