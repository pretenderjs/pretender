/**
 * parseURL - decompose a URL into its parts
 * @param  {String} url a URL
 * @return {Object} parts of the URL, including the following
 *
 * 'https://www.yahoo.com:1234/mypage?test=yes#abc'
 *
 * {
 *   host: 'www.yahoo.com:1234',
 *   protocol: 'https:',
 *   search: '?test=yes',
 *   hash: '#abc',
 *   href: 'https://www.yahoo.com:1234/mypage?test=yes#abc',
 *   pathname: '/mypage',
 *   fullpath: '/mypage?test=yes'
 * }
 */
export default function parseURL(url: string) {
  var anchor;
  if (typeof window.URL !== 'undefined') {
    anchor = new window.URL(url);
  } else {
    anchor = document.createElement('a');
    anchor.href = url;
  }

  if (!anchor.host) {
    // eslint-disable-next-line no-self-assign
    anchor.href = anchor.href; // IE: load the host and protocol
  }

  var pathname = anchor.pathname;
  if (pathname.charAt(0) !== '/') {
    pathname = '/' + pathname; // IE: prepend leading slash
  }

  var host = anchor.host;
  if (anchor.port === '80' || anchor.port === '443') {
    host = anchor.hostname; // IE: remove default port
  }

  return {
    host: host,
    protocol: anchor.protocol,
    search: anchor.search,
    hash: anchor.hash,
    href: anchor.href,
    pathname: pathname,
    fullpath: pathname + (anchor.search || '') + (anchor.hash || '')
  };
}
