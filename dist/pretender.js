(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'route-recognizer', 'fake_xml_http_request'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('route-recognizer'), require('fake_xml_http_request'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.RouteRecognizer, global.FakeXMLHttpRequest);
    global.pretender = mod.exports;
  }
})(this, function (exports, module, _routeRecognizer, _fake_xml_http_request) {
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _RouteRecognizer = _interopRequireDefault(_routeRecognizer);

  var _FakeXMLHttpRequest = _interopRequireDefault(_fake_xml_http_request);

  var slice = [].slice;

  function Pretender() /* routeMap1, routeMap2, ...*/{
    var maps = slice.call(arguments);
    // Herein we keep track of RouteRecognizer instances
    // keyed by HTTP method. Feel free to add more as needed.
    this.registry = {
      GET: new _RouteRecognizer['default'](),
      PUT: new _RouteRecognizer['default'](),
      POST: new _RouteRecognizer['default'](),
      DELETE: new _RouteRecognizer['default'](),
      PATCH: new _RouteRecognizer['default'](),
      HEAD: new _RouteRecognizer['default']()
    };

    this.handlers = [];
    this.handledRequests = [];
    this.passthroughRequests = [];
    this.unhandledRequests = [];
    this.requestReferences = [];

    // reference the native XMLHttpRequest object so
    // it can be restored later
    this._nativeXMLHttpRequest = window.XMLHttpRequest;

    // capture xhr requests, channeling them into
    // the route map.
    window.XMLHttpRequest = interceptor(this);

    // "start" the server
    this.running = true;

    // trigger the route map DSL.
    for (var i = 0; i < arguments.length; i++) {
      this.map(arguments[i]);
    }
  }

  function interceptor(pretender) {
    function FakeRequest() {
      // super()
      _FakeXMLHttpRequest['default'].call(this);
    }
    // extend
    var proto = new _FakeXMLHttpRequest['default']();
    proto.send = function send() {
      if (!pretender.running) {
        throw new Error('You shut down a Pretender instance while there was a pending request. ' + 'That request just tried to complete. Check to see if you accidentally shut down ' + 'a pretender earlier than you intended to');
      }

      _FakeXMLHttpRequest['default'].prototype.send.apply(this, arguments);
      if (!pretender.checkPassthrough(this)) {
        pretender.handleRequest(this);
      } else {
        var xhr = createPassthrough(this);
        xhr.send.apply(xhr, arguments);
      }
    };

    // passthrough handling
    var evts = ['error', 'timeout', 'progress', 'abort'];
    var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
    function createPassthrough(fakeXHR) {
      var xhr = fakeXHR._passthroughRequest = new pretender._nativeXMLHttpRequest();

      // use onload instead of onreadystatechange if the browser supports it
      if ('onload' in xhr) {
        evts.push('load');
      } else {
        evts.push('readystatechange');
      }

      // listen to all events to update lifecycle properties
      for (var i = 0; i < evts.length; i++) (function (evt) {
        xhr['on' + evt] = function (e) {
          // update lifecycle props on each event
          for (var i = 0; i < lifecycleProps.length; i++) {
            var prop = lifecycleProps[i];
            if (xhr[prop]) {
              fakeXHR[prop] = xhr[prop];
            }
          }
          // fire fake events where applicable
          fakeXHR.dispatchEvent(evt, e);
          if (fakeXHR['on' + evt]) {
            fakeXHR['on' + evt](e);
          }
        };
      })(evts[i]);
      xhr.open(fakeXHR.method, fakeXHR.url, fakeXHR.async, fakeXHR.username, fakeXHR.password);
      xhr.timeout = fakeXHR.timeout;
      xhr.withCredentials = fakeXHR.withCredentials;
      for (var h in fakeXHR.requestHeaders) {
        xhr.setRequestHeader(h, fakeXHR.requestHeaders[h]);
      }
      return xhr;
    }
    proto._passthroughCheck = function (method, args) {
      if (this._passthroughRequest) {
        return this._passthroughRequest[method].apply(this._passthroughRequest, args);
      }
      return _FakeXMLHttpRequest['default'].prototype[method].apply(this, arguments);
    };
    proto.abort = function abort() {
      return this._passthroughCheck('abort', arguments);
    };
    proto.getResponseHeader = function getResponseHeader() {
      return this._passthroughCheck('getResponseHeader', arguments);
    };
    proto.getAllResponseHeaders = function getAllResponseHeaders() {
      return this._passthroughCheck('getAllResponseHeaders', arguments);
    };

    FakeRequest.prototype = proto;
    return FakeRequest;
  }

  function verbify(verb) {
    return function (path, handler, async) {
      this.register(verb, path, handler, async);
    };
  }

  function throwIfURLDetected(url) {
    var HTTP_REGEXP = /^https?/;
    var message;

    if (HTTP_REGEXP.test(url)) {
      var parser = window.document.createElement('a');
      parser.href = url;

      message = "Pretender will not respond to requests for URLs. It is not possible to accurately simluate the browser's CSP. " + "Remove the " + parser.protocol + "//" + parser.hostname + " from " + url + " and try again";
      throw new Error(message);
    }
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

  var PASSTHROUGH = {};

  Pretender.prototype = {
    get: verbify('GET'),
    post: verbify('POST'),
    put: verbify('PUT'),
    'delete': verbify('DELETE'),
    patch: verbify('PATCH'),
    head: verbify('HEAD'),
    map: function map(maps) {
      maps.call(this);
    },
    register: function register(verb, path, handler, async) {
      if (!handler) {
        throw new Error("The function you tried passing to Pretender to handle " + verb + " " + path + " is undefined or missing.");
      }

      handler.numberOfCalls = 0;
      handler.async = async;
      this.handlers.push(handler);

      var registry = this.registry[verb];
      registry.add([{ path: path, handler: handler }]);
    },
    passthrough: PASSTHROUGH,
    checkPassthrough: function checkPassthrough(request) {
      var verb = request.method.toUpperCase();
      var path = request.url;

      throwIfURLDetected(path);

      verb = verb.toUpperCase();

      var recognized = this.registry[verb].recognize(path);
      var match = recognized && recognized[0];
      if (match && match.handler == PASSTHROUGH) {
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

        try {
          var statusHeadersAndBody = handler.handler(request),
              status = statusHeadersAndBody[0],
              headers = this.prepareHeaders(statusHeadersAndBody[1]),
              body = this.prepareBody(statusHeadersAndBody[2]),
              pretender = this;

          this.handleResponse(request, async, function () {
            request.respond(status, headers, body);
            pretender.handledRequest(verb, path, request);
          });
        } catch (error) {
          this.erroredRequest(verb, path, request, error);
          this.resolve(request);
        }
      } else {
        this.unhandledRequests.push(request);
        this.unhandledRequest(verb, path, request);
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
    requiresManualResolution: function requiresManualResolution(verb, path) {
      var handler = this._handlerFor(verb.toUpperCase(), path, {});
      if (!handler) {
        return false;
      }

      var async = handler.handler.async;
      return typeof async === 'function' ? async() === true : async === true;
    },
    prepareBody: function prepareBody(body) {
      return body;
    },
    prepareHeaders: function prepareHeaders(headers) {
      return headers;
    },
    handledRequest: function handledRequest(verb, path, request) {/* no-op */},
    passthroughRequest: function passthroughRequest(verb, path, request) {/* no-op */},
    unhandledRequest: function unhandledRequest(verb, path, request) {
      throw new Error("Pretender intercepted " + verb + " " + path + " but no handler was defined for this type of request");
    },
    erroredRequest: function erroredRequest(verb, path, request, error) {
      error.message = "Pretender intercepted " + verb + " " + path + " but encountered an error: " + error.message;
      throw error;
    },
    _handlerFor: function _handlerFor(verb, path, request) {
      var registry = this.registry[verb];
      var matches = registry.recognize(path);

      var match = matches ? matches[0] : null;
      if (match) {
        request.params = match.params;
        request.queryParams = matches.queryParams;
      }

      return match;
    },
    shutdown: function shutdown() {
      window.XMLHttpRequest = this._nativeXMLHttpRequest;

      // "stop" the server
      this.running = false;
    }
  };

  if (typeof window !== 'undefined') {
    window.Pretender = Pretender;
  }

  module.exports = Pretender;
});