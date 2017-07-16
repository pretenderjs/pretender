var describe = QUnit.module;
var it = QUnit.test;

describe('parseURL', function() {
  var parseURL = Pretender.parseURL;

  function testUrl(url, expectedParts) {
    it('pathname, fullpath, protocol, hash and search are correct', function(
      assert
    ) {
      var parts = parseURL(url);
      assert.ok(parts, 'Parts exist');

      assert.equal(
        parts.protocol,
        expectedParts.protocol,
        'protocol should be "' + expectedParts.protocol + '"'
      );
      assert.equal(
        parts.pathname,
        expectedParts.pathname,
        'pathname should be "' + expectedParts.pathname + '"'
      );
      assert.equal(
        parts.host,
        expectedParts.host,
        'hostname is equal to "' + expectedParts.host + '"'
      );
      assert.equal(
        parts.search,
        expectedParts.search,
        'search should be "' + expectedParts.search + '"'
      );
      assert.equal(
        parts.hash,
        expectedParts.hash,
        'hash should be "' + expectedParts.search + '"'
      );
      assert.equal(
        parts.fullpath,
        expectedParts.fullpath,
        'fullpath should be "' + expectedParts.fullpath + '"'
      );
    });
  }

  describe('relative HTTP URLs', function() {
    testUrl('/mock/my/request?test=abc#def', {
      protocol: 'http:',
      pathname: '/mock/my/request',
      host: window.location.host,
      search: '?test=abc',
      hash: '#def',
      fullpath: '/mock/my/request?test=abc#def',
    });
  });

  describe('same-origin absolute HTTP URLs', function() {
    testUrl(
      window.location.protocol +
        '//' +
        window.location.host +
        '/mock/my/request?test=abc#def',
      {
        protocol: window.location.protocol,
        pathname: '/mock/my/request',
        host: window.location.host,
        search: '?test=abc',
        hash: '#def',
        fullpath: '/mock/my/request?test=abc#def',
      }
    );
  });

  describe('cross-origin absolute HTTP URLs', function() {
    testUrl('https://www.yahoo.com/mock/my/request?test=abc', {
      protocol: 'https:',
      pathname: '/mock/my/request',
      host: 'www.yahoo.com',
      search: '?test=abc',
      hash: '',
      fullpath: '/mock/my/request?test=abc',
    });
  });
});
