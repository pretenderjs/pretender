import FakeXMLHttpRequest from 'fake-xml-http-request';
import * as FakeFetch from 'whatwg-fetch';
import parseURL from './parse-url';
import Registry from './registry';

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
Hosts.prototype.forURL = function(url) {
  var host = parseURL(url).host;
  var registry = this._registries[host];

  if (registry === undefined) {
    registry = (this._registries[host] = new Registry(host));
  }

  return registry.verbs;
};


function Pretender(/* routeMap1, routeMap2, ..., options*/) {
  this.hosts = new Hosts();

  var lastArg = arguments[arguments.length - 1];
  var options = typeof lastArg === 'object' ? lastArg : null;
  var shouldNotTrack = options && (options.trackRequests === false);
  var noopArray = { push: function() {}, length: 0 };

  this.handlers = [];
  this.handledRequests = shouldNotTrack ? noopArray: [];
  this.passthroughRequests = shouldNotTrack ? noopArray: [];
  this.unhandledRequests = shouldNotTrack ? noopArray: [];
  this.requestReferences = [];
  this.forcePassthrough = options && (options.forcePassthrough === true);
  this.disableUnhandled = options && (options.disableUnhandled === true);

  // reference the native XMLHttpRequest object so
  // it can be restored later
  this._nativeXMLHttpRequest = self.XMLHttpRequest;
  this.running = false;
  var ctx = { pretender: this };
  this.ctx = ctx;

  // capture xhr requests, channeling them into
  // the route map.
  self.XMLHttpRequest = interceptor(ctx);

  // polyfill fetch when xhr is ready
  this._fetchProps = FakeFetch ? ['fetch', 'Headers', 'Request', 'Response'] : [];
  this._fetchProps.forEach(function(name) {
    this['_native' + name] = self[name];
    self[name] = FakeFetch[name];
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
    } else {
      ctx.pretender.handleRequest(this);
    }
  };


  function createPassthrough(fakeXHR) {
    // event types to handle on the xhr
    var evts = ['error', 'timeout', 'abort', 'readystatechange'];

    // event types to handle on the xhr.upload
    var uploadEvents = [];

    // properties to copy from the native xhr to fake xhr
    var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'responseURL', 'status', 'statusText'];

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
      xhr['on' + eventType] = function(event) {
        copyLifecycleProperties(lifecycleProps, xhr, fakeXHR);
        dispatchEvent(fakeXHR, eventType, event);
      };
    }

    // set the on- handler on the native xhr's `upload` property for
    // the given eventType
    function createUploadHandler(eventType) {
      if (xhr.upload) {
        xhr.upload['on' + eventType] = function(event) {
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

  FakeRequest.prototype._passthroughCheck = function(method, args) {
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
  return function(path, handler, async) {
    return this.register(verb, path, handler, async);
  };
}

// Creates fake progress events every 50ms until the request is complete
function scheduleProgressEvent(request) {
  setTimeout(function() {
    if (!request.aborted && !request.status) {
      if (request && request.requestBody && request.requestBody.size) {
        var size = request.requestBody.size;
        request.upload._progress(true, size, size);
      }
      var length = (request.responseText && request.responseText.length) || 0;
      request._progress(true, length, length);
      scheduleProgressEvent(request);
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
  map: function(maps) {
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

    if ((match && match.handler === PASSTHROUGH) || this.forcePassthrough)  {
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

      var _handleRequest = function(statusHeadersAndBody) {
        if (!isArray(statusHeadersAndBody)) {
          var note = 'Remember to `return [status, headers, body];` in your route handler.';
          throw new Error('Nothing returned by handler for ' + path + '. ' + note);
        }

        var status = statusHeadersAndBody[0];
        var headers = pretender.prepareHeaders(statusHeadersAndBody[1]);
        var body = pretender.prepareBody(statusHeadersAndBody[2], headers);

        pretender.handleResponse(request, async, function() {
          request.respond(status, headers, body);
          pretender.handledRequest(verb, path, request);
        });
      };

      try {
        var result = handler.handler(request);
        if (result && typeof result.then === 'function') {
          // `result` is a promise, resolve it
          result.then(function(resolvedResult) {
            _handleRequest(resolvedResult);
          });
        } else {
          _handleRequest(result);
        }
      } catch (error) {
        this.erroredRequest(verb, path, request, error);
        this.resolve(request);
      }
    } else {
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
    } else {
      var pretender = this;
      pretender.requestReferences.push({
        request: request,
        callback: callback
      });

      if (delay !== true) {
        scheduleProgressEvent(request, new Date(), delay);
        setTimeout(function() {
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
  requiresManualResolution: function(verb, path) {
    var handler = this._handlerFor(verb.toUpperCase(), path, {});
    if (!handler) { return false; }

    var async = handler.handler.async;
    return typeof async === 'function' ? async() === true : async === true;
  },
  prepareBody: function(body) { return body; },
  prepareHeaders: function(headers) { return headers; },
  handledRequest: function(/* verb, path, request */) { /* no-op */},
  passthroughRequest: function(/* verb, path, request */) { /* no-op */},
  unhandledRequest: function(verb, path/*, request */) {
    throw new Error('Pretender intercepted ' + verb + ' ' +
      path + ' but no handler was defined for this type of request');
  },
  erroredRequest: function(verb, path, request, error) {
    error.message = 'Pretender intercepted ' + verb + ' ' +
      path + ' but encountered an error: ' + error.message;
    throw error;
  },
  _handlerFor: function(verb, url, request) {
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
    self.XMLHttpRequest = this._nativeXMLHttpRequest;
    this._fetchProps.forEach(function(name) {
      self[name] = this['_native' + name];
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
