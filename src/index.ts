import FakeXMLHttpRequest from 'fake-xml-http-request';
import * as FakeFetch from 'whatwg-fetch';
import parseURL from './parse-url';
import Registry from './registry';
import Hosts from './hosts';
import {createPassthrough} from './create-passthrough';

function Pretender(/* routeMap1, routeMap2, ..., options*/) {
  this.hosts = new Hosts();

  let lastArg = arguments[arguments.length - 1];
  let options = typeof lastArg === 'object' ? lastArg : null;
  let shouldNotTrack = options && (options.trackRequests === false);
  let noopArray = { push: function() {}, length: 0 };

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
  let ctx = { pretender: this };
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
  let argLength = options ? arguments.length - 1 : arguments.length;
  for (let i = 0; i < argLength; i++) {
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
    this.sendArguments = arguments;
    if (!ctx.pretender.running) {
      throw new Error('You shut down a Pretender instance while there was a pending request. ' +
            'That request just tried to complete. Check to see if you accidentally shut down ' +
            'a pretender earlier than you intended to');
    }

    FakeXMLHttpRequest.prototype.send.apply(this, arguments);

    if (ctx.pretender.checkPassthrough(this)) {
      this.passthrough(ctx.pretender._nativeXMLHttpRequest);
    } else {
      ctx.pretender.handleRequest(this);
    }
  };

  FakeRequest.prototype.passthrough = function passthrough(nativeXMLHttpRequest) {
    if (!this.sendArguments) {
      throw new Error('You attempted to passthrough a FakeRequest that was never sent. ' +
            'Call `.send()` on the original request first');
    }
    var xhr = createPassthrough(this, nativeXMLHttpRequest);
    xhr.send.apply(xhr, this.sendArguments);
    return xhr;
  };

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

function scheduleProgressEvent(request, startTime, totalTime) {
  setTimeout(function() {
    if (!request.aborted && !request.status) {
      let elapsedTime = new Date().getTime() - startTime.getTime();
      let progressTotal;
      let body = request.requestBody;
      if (!body) {
        progressTotal = 0;
      } else {
        // Support Blob, BufferSource, USVString, ArrayBufferView
        progressTotal = body.byteLength || body.size || body.length || 0;
      }
      let progressTransmitted =
        totalTime <= 0 ? 0 : (elapsedTime / totalTime) * progressTotal;
      // ProgressEvent expects loaded, total
      // https://xhr.spec.whatwg.org/#interface-progressevent
      request.upload._progress(true, progressTransmitted, progressTotal);
      request._progress(true, progressTransmitted, progressTotal);
      scheduleProgressEvent(request, startTime, totalTime);
    }
  }, 50);
}

function isArray(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
}

let PASSTHROUGH = {};

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

    let registry = this.hosts.forURL(url)[verb];

    registry.add([{
      path: parseURL(url).fullpath,
      handler: handler
    }]);

    return handler;
  },
  passthrough: PASSTHROUGH,
  checkPassthrough: function checkPassthrough(request) {
    let verb = request.method.toUpperCase();
    let path = parseURL(request.url).fullpath;
    let recognized = this.hosts.forURL(request.url)[verb].recognize(path);
    let match = recognized && recognized[0];

    if ((match && match.handler === PASSTHROUGH) || this.forcePassthrough)  {
      this.passthroughRequests.push(request);
      this.passthroughRequest(verb, path, request);
      return true;
    }

    return false;
  },
  handleRequest: function handleRequest(request) {
    let verb = request.method.toUpperCase();
    let path = request.url;

    let handler = this._handlerFor(verb, path, request);

    if (handler) {
      handler.handler.numberOfCalls++;
      let async = handler.handler.async;
      this.handledRequests.push(request);

      let pretender = this;

      let _handleRequest = function(statusHeadersAndBody) {
        if (!isArray(statusHeadersAndBody)) {
          let note = 'Remember to `return [status, headers, body];` in your route handler.';
          throw new Error('Nothing returned by handler for ' + path + '. ' + note);
        }

        let status = statusHeadersAndBody[0];
        let headers = pretender.prepareHeaders(statusHeadersAndBody[1]);
        let body = pretender.prepareBody(statusHeadersAndBody[2], headers);

        pretender.handleResponse(request, async, function() {
          request.respond(status, headers, body);
          pretender.handledRequest(verb, path, request);
        });
      };

      try {
        let result = handler.handler(request);
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
    let delay = typeof strategy === 'function' ? strategy() : strategy;
    delay = typeof delay === 'boolean' || typeof delay === 'number' ? delay : 0;

    if (delay === false) {
      callback();
    } else {
      let pretender = this;
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
    for (let i = 0, len = this.requestReferences.length; i < len; i++) {
      let res = this.requestReferences[i];
      if (res.request === request) {
        res.callback();
        this.requestReferences.splice(i, 1);
        break;
      }
    }
  },
  requiresManualResolution: function(verb, path) {
    let handler = this._handlerFor(verb.toUpperCase(), path, {});
    if (!handler) { return false; }

    let async = handler.handler.async;
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
    let registry = this.hosts.forURL(url)[verb];
    let matches = registry.recognize(parseURL(url).fullpath);

    let match = matches ? matches[0] : null;
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
