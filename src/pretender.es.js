import self$1 from './iife-self-placeholder.js';
import RouteRecognizer from 'route-recognizer';
import FakeXMLHttpRequest from 'fake-xml-http-request';

var support = {
  searchParams: 'URLSearchParams' in self,
  iterable: 'Symbol' in self && 'iterator' in Symbol,
  blob:
    'FileReader' in self &&
    'Blob' in self &&
    (function() {
      try {
        new Blob();
        return true
      } catch (e) {
        return false
      }
    })(),
  formData: 'FormData' in self,
  arrayBuffer: 'ArrayBuffer' in self
};

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ];

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    };
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
    throw new TypeError('Invalid character in header field name')
  }
  return name.toLowerCase()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift();
      return {done: value === undefined, value: value}
    }
  };

  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator
    };
  }

  return iterator
}

function Headers(headers) {
  this.map = {};

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name]);
    }, this);
  }
}

Headers.prototype.append = function(name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ', ' + value : value;
};

Headers.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)];
};

Headers.prototype.get = function(name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null
};

Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name))
};

Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};

Headers.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};

Headers.prototype.keys = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push(name);
  });
  return iteratorFor(items)
};

Headers.prototype.values = function() {
  var items = [];
  this.forEach(function(value) {
    items.push(value);
  });
  return iteratorFor(items)
};

Headers.prototype.entries = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items)
};

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true;
}

function fileReaderReady(reader) {
  return new Promise(function(resolve, reject) {
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = function() {
      reject(reader.error);
    };
  })
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise
}

function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsText(blob);
  return promise
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    var view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false;

  this._initBody = function(body) {
    this._bodyInit = body;
    if (!body) {
      this._bodyText = '';
    } else if (typeof body === 'string') {
      this._bodyText = body;
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body;
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body;
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer]);
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body);
    } else {
      this._bodyText = body = Object.prototype.toString.call(body);
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8');
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type);
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
      }
    }
  };

  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return Promise.resolve(new Blob([this._bodyText]))
      }
    };

    this.arrayBuffer = function() {
      if (this._bodyArrayBuffer) {
        return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
      } else {
        return this.blob().then(readBlobAsArrayBuffer)
      }
    };
  }

  this.text = function() {
    var rejected = consumed(this);
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return Promise.resolve(this._bodyText)
    }
  };

  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode)
    };
  }

  this.json = function() {
    return this.text().then(JSON.parse)
  };

  return this
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

function normalizeMethod(method) {
  var upcased = method.toUpperCase();
  return methods.indexOf(upcased) > -1 ? upcased : method
}

function Request(input, options) {
  options = options || {};
  var body = options.body;

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url;
    this.credentials = input.credentials;
    if (!options.headers) {
      this.headers = new Headers(input.headers);
    }
    this.method = input.method;
    this.mode = input.mode;
    this.signal = input.signal;
    if (!body && input._bodyInit != null) {
      body = input._bodyInit;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }

  this.credentials = options.credentials || this.credentials || 'same-origin';
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers);
  }
  this.method = normalizeMethod(options.method || this.method || 'GET');
  this.mode = options.mode || this.mode || null;
  this.signal = options.signal || this.signal;
  this.referrer = null;

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body);
}

Request.prototype.clone = function() {
  return new Request(this, {body: this._bodyInit})
};

function decode(body) {
  var form = new FormData();
  body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
  return form
}

function parseHeaders(rawHeaders) {
  var headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
    var parts = line.split(':');
    var key = parts.shift().trim();
    if (key) {
      var value = parts.join(':').trim();
      headers.append(key, value);
    }
  });
  return headers
}

Body.call(Request.prototype);

function Response(bodyInit, options) {
  if (!options) {
    options = {};
  }

  this.type = 'default';
  this.status = options.status === undefined ? 200 : options.status;
  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = 'statusText' in options ? options.statusText : 'OK';
  this.headers = new Headers(options.headers);
  this.url = options.url || '';
  this._initBody(bodyInit);
}

Body.call(Response.prototype);

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
};

Response.error = function() {
  var response = new Response(null, {status: 0, statusText: ''});
  response.type = 'error';
  return response
};

var redirectStatuses = [301, 302, 303, 307, 308];

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, {status: status, headers: {location: url}})
};

var DOMException = self.DOMException;
try {
  new DOMException();
} catch (err) {
  DOMException = function(message, name) {
    this.message = message;
    this.name = name;
    var error = Error(message);
    this.stack = error.stack;
  };
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
}

function fetch(input, init) {
  return new Promise(function(resolve, reject) {
    var request = new Request(input, init);

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    var xhr = new XMLHttpRequest();

    function abortXhr() {
      xhr.abort();
    }

    xhr.onload = function() {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      };
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      resolve(new Response(body, options));
    };

    xhr.onerror = function() {
      reject(new TypeError('Network request failed'));
    };

    xhr.ontimeout = function() {
      reject(new TypeError('Network request failed'));
    };

    xhr.onabort = function() {
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.open(request.method, request.url, true);

    if (request.credentials === 'include') {
      xhr.withCredentials = true;
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false;
    }

    if ('responseType' in xhr && support.blob) {
      xhr.responseType = 'blob';
    }

    request.headers.forEach(function(value, name) {
      xhr.setRequestHeader(name, value);
    });

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr);

      xhr.onreadystatechange = function() {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr);
        }
      };
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
  })
}

fetch.polyfill = true;

if (!self.fetch) {
  self.fetch = fetch;
  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;
}

var FakeFetch = /*#__PURE__*/Object.freeze({
  Headers: Headers,
  Request: Request,
  Response: Response,
  get DOMException () { return DOMException; },
  fetch: fetch
});

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
function parseURL(url) {
    // TODO: something for when document isn't present... #yolo
    var anchor = document.createElement('a');
    anchor.href = url;
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
/**
 * Registry
 *
 * A registry is a map of HTTP verbs to route recognizers.
 */
function Registry( /* host */) {
    // Herein we keep track of RouteRecognizer instances
    // keyed by HTTP method. Feel free to add more as needed.
    this.verbs = {
        GET: new RouteRecognizer(),
        PUT: new RouteRecognizer(),
        POST: new RouteRecognizer(),
        DELETE: new RouteRecognizer(),
        PATCH: new RouteRecognizer(),
        HEAD: new RouteRecognizer(),
        OPTIONS: new RouteRecognizer()
    };
}
/**
 * Hosts
 *
 * a map of hosts to Registries, ultimately allowing
 * a per-host-and-port, per HTTP verb lookup of RouteRecognizers
 */
function Hosts() {
    this._registries = {};
}
/**
 * Hosts#forURL - retrieve a map of HTTP verbs to RouteRecognizers
 *                for a given URL
 *
 * @param  {String} url a URL
 * @return {Registry}   a map of HTTP verbs to RouteRecognizers
 *                      corresponding to the provided URL's
 *                      hostname and port
 */
Hosts.prototype.forURL = function (url) {
    var host = parseURL(url).host;
    var registry = this._registries[host];
    if (registry === undefined) {
        registry = (this._registries[host] = new Registry(host));
    }
    return registry.verbs;
};
function Pretender( /* routeMap1, routeMap2, ..., options*/) {
    this.hosts = new Hosts();
    var lastArg = arguments[arguments.length - 1];
    var options = typeof lastArg === 'object' ? lastArg : null;
    var shouldNotTrack = options && (options.trackRequests === false);
    var noopArray = { push: function () { }, length: 0 };
    this.handlers = [];
    this.handledRequests = shouldNotTrack ? noopArray : [];
    this.passthroughRequests = shouldNotTrack ? noopArray : [];
    this.unhandledRequests = shouldNotTrack ? noopArray : [];
    this.requestReferences = [];
    this.forcePassthrough = options && (options.forcePassthrough === true);
    this.disableUnhandled = options && (options.disableUnhandled === true);
    // reference the native XMLHttpRequest object so
    // it can be restored later
    this._nativeXMLHttpRequest = self$1.XMLHttpRequest;
    this.running = false;
    var ctx = { pretender: this };
    this.ctx = ctx;
    // capture xhr requests, channeling them into
    // the route map.
    self$1.XMLHttpRequest = interceptor(ctx);
    // polyfill fetch when xhr is ready
    this._fetchProps = ['fetch', 'Headers', 'Request', 'Response'];
    this._fetchProps.forEach(function (name) {
        this['_native' + name] = self$1[name];
        self$1[name] = FakeFetch[name];
    }, this);
    // 'start' the server
    this.running = true;
    // trigger the route map DSL.
    var argLength = options ? arguments.length - 1 : arguments.length;
    for (var i = 0; i < argLength; i++) {
        this.map(arguments[i]);
    }
}
function interceptor(ctx) {
    function FakeRequest() {
        // super()
        FakeXMLHttpRequest.call(this);
    }
    FakeRequest.prototype = Object.create(FakeXMLHttpRequest.prototype);
    FakeRequest.prototype.constructor = FakeRequest;
    // extend
    FakeRequest.prototype.send = function send() {
        if (!ctx.pretender.running) {
            throw new Error('You shut down a Pretender instance while there was a pending request. ' +
                'That request just tried to complete. Check to see if you accidentally shut down ' +
                'a pretender earlier than you intended to');
        }
        FakeXMLHttpRequest.prototype.send.apply(this, arguments);
        if (ctx.pretender.checkPassthrough(this)) {
            var xhr = createPassthrough(this);
            xhr.send.apply(xhr, arguments);
        }
        else {
            ctx.pretender.handleRequest(this);
        }
    };
    function createPassthrough(fakeXHR) {
        // event types to handle on the xhr
        var evts = ['error', 'timeout', 'abort', 'readystatechange'];
        // event types to handle on the xhr.upload
        var uploadEvents = [];
        // properties to copy from the native xhr to fake xhr
        var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
        var xhr = fakeXHR._passthroughRequest = new ctx.pretender._nativeXMLHttpRequest();
        xhr.open(fakeXHR.method, fakeXHR.url, fakeXHR.async, fakeXHR.username, fakeXHR.password);
        if (fakeXHR.responseType === 'arraybuffer') {
            lifecycleProps = ['readyState', 'response', 'status', 'statusText'];
            xhr.responseType = fakeXHR.responseType;
        }
        // use onload if the browser supports it
        if ('onload' in xhr) {
            evts.push('load');
        }
        // add progress event for async calls
        // avoid using progress events for sync calls, they will hang https://bugs.webkit.org/show_bug.cgi?id=40996.
        if (fakeXHR.async && fakeXHR.responseType !== 'arraybuffer') {
            evts.push('progress');
            uploadEvents.push('progress');
        }
        // update `propertyNames` properties from `fromXHR` to `toXHR`
        function copyLifecycleProperties(propertyNames, fromXHR, toXHR) {
            for (var i = 0; i < propertyNames.length; i++) {
                var prop = propertyNames[i];
                if (prop in fromXHR) {
                    toXHR[prop] = fromXHR[prop];
                }
            }
        }
        // fire fake event on `eventable`
        function dispatchEvent(eventable, eventType, event) {
            eventable.dispatchEvent(event);
            if (eventable['on' + eventType]) {
                eventable['on' + eventType](event);
            }
        }
        // set the on- handler on the native xhr for the given eventType
        function createHandler(eventType) {
            xhr['on' + eventType] = function (event) {
                copyLifecycleProperties(lifecycleProps, xhr, fakeXHR);
                dispatchEvent(fakeXHR, eventType, event);
            };
        }
        // set the on- handler on the native xhr's `upload` property for
        // the given eventType
        function createUploadHandler(eventType) {
            if (xhr.upload) {
                xhr.upload['on' + eventType] = function (event) {
                    dispatchEvent(fakeXHR.upload, eventType, event);
                };
            }
        }
        var i;
        for (i = 0; i < evts.length; i++) {
            createHandler(evts[i]);
        }
        for (i = 0; i < uploadEvents.length; i++) {
            createUploadHandler(uploadEvents[i]);
        }
        if (fakeXHR.async) {
            xhr.timeout = fakeXHR.timeout;
            xhr.withCredentials = fakeXHR.withCredentials;
        }
        for (var h in fakeXHR.requestHeaders) {
            xhr.setRequestHeader(h, fakeXHR.requestHeaders[h]);
        }
        return xhr;
    }
    FakeRequest.prototype._passthroughCheck = function (method, args) {
        if (this._passthroughRequest) {
            return this._passthroughRequest[method].apply(this._passthroughRequest, args);
        }
        return FakeXMLHttpRequest.prototype[method].apply(this, args);
    };
    FakeRequest.prototype.abort = function abort() {
        return this._passthroughCheck('abort', arguments);
    };
    FakeRequest.prototype.getResponseHeader = function getResponseHeader() {
        return this._passthroughCheck('getResponseHeader', arguments);
    };
    FakeRequest.prototype.getAllResponseHeaders = function getAllResponseHeaders() {
        return this._passthroughCheck('getAllResponseHeaders', arguments);
    };
    if (ctx.pretender._nativeXMLHttpRequest.prototype._passthroughCheck) {
        // eslint-disable-next-line no-console
        console.warn('You created a second Pretender instance while there was already one running. ' +
            'Running two Pretender servers at once will lead to unexpected results and will ' +
            'be removed entirely in a future major version.' +
            'Please call .shutdown() on your instances when you no longer need them to respond.');
    }
    return FakeRequest;
}
function verbify(verb) {
    return function (path, handler, async) {
        return this.register(verb, path, handler, async);
    };
}
function scheduleProgressEvent(request, startTime, totalTime) {
    setTimeout(function () {
        if (!request.aborted && !request.status) {
            var ellapsedTime = new Date().getTime() - startTime.getTime();
            request.upload._progress(true, ellapsedTime, totalTime);
            request._progress(true, ellapsedTime, totalTime);
            scheduleProgressEvent(request, startTime, totalTime);
        }
    }, 50);
}
function isArray(array) {
    return Object.prototype.toString.call(array) === '[object Array]';
}
var PASSTHROUGH = {};
Pretender.prototype = {
    get: verbify('GET'),
    post: verbify('POST'),
    put: verbify('PUT'),
    'delete': verbify('DELETE'),
    patch: verbify('PATCH'),
    head: verbify('HEAD'),
    options: verbify('OPTIONS'),
    map: function (maps) {
        maps.call(this);
    },
    register: function register(verb, url, handler, async) {
        if (!handler) {
            throw new Error('The function you tried passing to Pretender to handle ' +
                verb + ' ' + url + ' is undefined or missing.');
        }
        handler.numberOfCalls = 0;
        handler.async = async;
        this.handlers.push(handler);
        var registry = this.hosts.forURL(url)[verb];
        registry.add([{
                path: parseURL(url).fullpath,
                handler: handler
            }]);
        return handler;
    },
    passthrough: PASSTHROUGH,
    checkPassthrough: function checkPassthrough(request) {
        var verb = request.method.toUpperCase();
        var path = parseURL(request.url).fullpath;
        var recognized = this.hosts.forURL(request.url)[verb].recognize(path);
        var match = recognized && recognized[0];
        if ((match && match.handler === PASSTHROUGH) || this.forcePassthrough) {
            this.passthroughRequests.push(request);
            this.passthroughRequest(verb, path, request);
            return true;
        }
        return false;
    },
    handleRequest: function handleRequest(request) {
        var verb = request.method.toUpperCase();
        var path = request.url;
        var handler = this._handlerFor(verb, path, request);
        if (handler) {
            handler.handler.numberOfCalls++;
            var async = handler.handler.async;
            this.handledRequests.push(request);
            var pretender = this;
            var _handleRequest = function (statusHeadersAndBody) {
                if (!isArray(statusHeadersAndBody)) {
                    var note = 'Remember to `return [status, headers, body];` in your route handler.';
                    throw new Error('Nothing returned by handler for ' + path + '. ' + note);
                }
                var status = statusHeadersAndBody[0];
                var headers = pretender.prepareHeaders(statusHeadersAndBody[1]);
                var body = pretender.prepareBody(statusHeadersAndBody[2], headers);
                pretender.handleResponse(request, async, function () {
                    request.respond(status, headers, body);
                    pretender.handledRequest(verb, path, request);
                });
            };
            try {
                var result = handler.handler(request);
                if (result && typeof result.then === 'function') {
                    // `result` is a promise, resolve it
                    result.then(function (resolvedResult) {
                        _handleRequest(resolvedResult);
                    });
                }
                else {
                    _handleRequest(result);
                }
            }
            catch (error) {
                this.erroredRequest(verb, path, request, error);
                this.resolve(request);
            }
        }
        else {
            if (!this.disableUnhandled) {
                this.unhandledRequests.push(request);
                this.unhandledRequest(verb, path, request);
            }
        }
    },
    handleResponse: function handleResponse(request, strategy, callback) {
        var delay = typeof strategy === 'function' ? strategy() : strategy;
        delay = typeof delay === 'boolean' || typeof delay === 'number' ? delay : 0;
        if (delay === false) {
            callback();
        }
        else {
            var pretender = this;
            pretender.requestReferences.push({
                request: request,
                callback: callback
            });
            if (delay !== true) {
                scheduleProgressEvent(request, new Date(), delay);
                setTimeout(function () {
                    pretender.resolve(request);
                }, delay);
            }
        }
    },
    resolve: function resolve(request) {
        for (var i = 0, len = this.requestReferences.length; i < len; i++) {
            var res = this.requestReferences[i];
            if (res.request === request) {
                res.callback();
                this.requestReferences.splice(i, 1);
                break;
            }
        }
    },
    requiresManualResolution: function (verb, path) {
        var handler = this._handlerFor(verb.toUpperCase(), path, {});
        if (!handler) {
            return false;
        }
        var async = handler.handler.async;
        return typeof async === 'function' ? async() === true : async === true;
    },
    prepareBody: function (body) { return body; },
    prepareHeaders: function (headers) { return headers; },
    handledRequest: function ( /* verb, path, request */) { },
    passthroughRequest: function ( /* verb, path, request */) { },
    unhandledRequest: function (verb, path /*, request */) {
        throw new Error('Pretender intercepted ' + verb + ' ' +
            path + ' but no handler was defined for this type of request');
    },
    erroredRequest: function (verb, path, request, error) {
        error.message = 'Pretender intercepted ' + verb + ' ' +
            path + ' but encountered an error: ' + error.message;
        throw error;
    },
    _handlerFor: function (verb, url, request) {
        var registry = this.hosts.forURL(url)[verb];
        var matches = registry.recognize(parseURL(url).fullpath);
        var match = matches ? matches[0] : null;
        if (match) {
            request.params = match.params;
            request.queryParams = matches.queryParams;
        }
        return match;
    },
    shutdown: function shutdown() {
        self$1.XMLHttpRequest = this._nativeXMLHttpRequest;
        this._fetchProps.forEach(function (name) {
            self$1[name] = this['_native' + name];
        }, this);
        this.ctx.pretender = undefined;
        // 'stop' the server
        this.running = false;
    }
};
Pretender.parseURL = parseURL;
Pretender.Hosts = Hosts;
Pretender.Registry = Registry;

export default Pretender;
