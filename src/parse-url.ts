import { default as ParsedUrl } from 'url-parse';

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
  var parsedUrl = new ParsedUrl(url);

  if (!parsedUrl.host) {
    // eslint-disable-next-line no-self-assign
    parsedUrl.href = parsedUrl.href; // IE: load the host and protocol
  }

  var pathname = parsedUrl.pathname;
  if (pathname.charAt(0) !== '/') {
    pathname = '/' + pathname; // IE: prepend leading slash
  }

  var host = parsedUrl.host;
  if (parsedUrl.port === '80' || parsedUrl.port === '443') {
    host = parsedUrl.hostname; // IE: remove default port
  }

  return {
    host: host,
    protocol: parsedUrl.protocol,
    search: parsedUrl.query,
    hash: parsedUrl.hash,
    href: parsedUrl.href,
    pathname: pathname,
    fullpath: pathname + (parsedUrl.query || '') + (parsedUrl.hash || '')
  };
}
