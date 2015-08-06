module('parseURL', {});

var parseURL = Pretender.parseURL;

function testUrl(assert, url, expectedParts) {
  var parts = parseURL(url);
  assert.ok(parts, 'Parts exist');

  assert.equal(parts.protocol, expectedParts.protocol,  'protocol should be \"' + expectedParts.protocol + '\"');
  assert.equal(parts.pathname, expectedParts.pathname, 'pathname should be \"' + expectedParts.pathname + '\"');
  assert.equal(parts.host, expectedParts.host, 'hostname is equal to \"' + expectedParts.host + '\"');
  assert.equal(parts.search, expectedParts.search, 'search should be \"' + expectedParts.search + '\"');
  assert.equal(parts.hash, expectedParts.hash, 'hash should be \"' + expectedParts.search + '\"');
  assert.equal(parts.fullpath, expectedParts.fullpath, 'fullpath should be \"' + expectedParts.fullpath + '\"');
}

test('pathname, fullpath, protocol, hash and search are correct for relative HTTP URLs', function(assert) {
  testUrl(assert, '/mock/my/request?test=abc#def', {
    protocol: 'http:',
    pathname: '/mock/my/request',
    host: window.location.host,
    search: '?test=abc',
    hash: '#def',
    fullpath: '/mock/my/request?test=abc#def'
  });
});

test('pathname, fullpath, protocol, hash and search are correct for same-origin absolute HTTP URLs', function(assert) {
  testUrl(assert, window.location.protocol + '//' + window.location.host + '/mock/my/request?test=abc#def', {
    protocol: window.location.protocol,
    pathname: '/mock/my/request',
    host: window.location.host,
    search: '?test=abc',
    hash: '#def',
    fullpath: '/mock/my/request?test=abc#def'
  });
});

test('pathname, fullpath, protocol, hash and search are correct for cross-origin absolute HTTP URLs', function(assert) {
  testUrl(assert, 'https://www.yahoo.com/mock/my/request?test=abc', {
    protocol: 'https:',
    pathname: '/mock/my/request',
    host: 'www.yahoo.com',
    search: '?test=abc',
    hash: '',
    fullpath: '/mock/my/request?test=abc'
  });
});
