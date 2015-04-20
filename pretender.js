(function(window){

var isNode = typeof process !== 'undefined' && process.toString() === '[object process]';
var RouteRecognizer = isNode ? require('route-recognizer')['default'] : window.RouteRecognizer;
var FakeXMLHttpRequest = isNode ? require('./bower_components/FakeXMLHttpRequest/fake_xml_http_request') : window.FakeXMLHttpRequest;
var slice = [].slice;

function Pretender(/* routeMap1, routeMap2, ...*/){
  maps = slice.call(arguments);
  // Herein we keep track of RouteRecognizer instances
  // keyed by HTTP method. Feel free to add more as needed.
  this.registry = {
    GET: new RouteRecognizer(),
    PUT: new RouteRecognizer(),
    POST: new RouteRecognizer(),
    DELETE: new RouteRecognizer(),
    PATCH: new RouteRecognizer(),
    HEAD: new RouteRecognizer()
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
  for(i=0; i < arguments.length; i++){
    this.map(arguments[i]);
  }
}

function interceptor(pretender) {
  function FakeRequest(){
    // super()
    FakeXMLHttpRequest.call(this);
  }
  // extend
  var proto = new FakeXMLHttpRequest();
  proto.send = function send(){
    if (!pretender.running) {
      throw new Error('You shut down a Pretender instance while there was a pending request. '+
            'That request just tried to complete. Check to see if you accidentally shut down '+
            'a pretender earlier than you intended to');
    }

    FakeXMLHttpRequest.prototype.send.apply(this, arguments);
    if (!pretender.checkPassthrough(this)) {
      pretender.handleRequest(this);
    }
    else {
      var xhr = createPassthrough(this);
      xhr.send.apply(xhr, arguments);
    }
  };

  // passthrough handling
  var evts = ['load', 'error', 'timeout', 'progress', 'abort', 'readystatechange'];
  var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
  function createPassthrough(fakeXHR) {
    var xhr = fakeXHR._passthroughRequest = new pretender._nativeXMLHttpRequest();
    // listen to all events to update lifecycle properties
    for (var i = 0; i < evts.length; i++) (function(evt) {
      xhr['on' + evt] = function(e) {
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
  proto._passthroughCheck = function(method, arguments) {
    if (this._passthroughRequest) {
      return this._passthroughRequest[method].apply(this._passthroughRequest, arguments);
    }
    return FakeXMLHttpRequest.prototype[method].apply(this, arguments);
  }
  proto.abort = function abort(){
    return this._passthroughCheck('abort', arguments);
  }
  proto.getResponseHeader = function getResponseHeader(){
    return this._passthroughCheck('getResponseHeader', arguments);
  }
  proto.getAllResponseHeaders = function getAllResponseHeaders(){
    return this._passthroughCheck('getAllResponseHeaders', arguments);
  }

  FakeRequest.prototype = proto;
  return FakeRequest;
}

function verbify(verb){
  return function(path, handler, async){
    this.register(verb, path, handler, async);
  };
}

function throwIfURLDetected(url){
  var HTTP_REGEXP = /^https?/;
  var message;

  if(HTTP_REGEXP.test(url)) {
    var parser = window.document.createElement('a');
    parser.href = url;

    message = "Pretender will not respond to requests for URLs. It is not possible to accurately simluate the browser's CSP. "+
              "Remove the " + parser.protocol +"//"+ parser.hostname +" from " + url + " and try again";
    throw new Error(message)
  }
}

/*
  By the spec, uploads/downloads should trigger progress events each 50ms or each time a byte is
  sent, whatever happens **less** often. Since we cannot simulate byte transfer, pretender will
  file progress events each 50ms.

  Extrictly speaking, a `loadstart` event should be fired af the beginning, followed by
  many `progress` events, followed by a `load` event (if successful) and finally by a `loadend`
  event (regardless of the success or failure of the request).

  We might not want all this and stay with only the "progress" event.
*/
function scheduleProgressEvents(request, delay) {
  if (delay === 0) {
    return
  }
  var numberOfEvents = Math.floor(delay / 50);
  var i;
  if (request.onerror && typeof request.onerror === 'function') {
    for (i = 0; i < numberOfEvents; i++) {
      setTimeout(function() {
        request._progress(true, i * 50, delay);
      }, i * 50);
    }
  }
  if (request.upload.onerror && typeof request.upload.onerror === 'function') {
    for (i = 0; i < numberOfEvents; i++) {
      setTimeout(function() {
        request.upload._progress(true, i * 50, delay);
      }, i * 50);
    }
  }
}

var PASSTHROUGH = {};

Pretender.prototype = {
  get: verbify('GET'),
  post: verbify('POST'),
  put: verbify('PUT'),
  'delete': verbify('DELETE'),
  patch: verbify('PATCH'),
  head: verbify('HEAD'),
  map: function(maps){
    maps.call(this);
  },
  register: function register(verb, path, handler, async){
    if (!handler) {
      throw new Error("The function you tried passing to Pretender to handle " + verb + " " + path + " is undefined or missing.");
    }

    handler.numberOfCalls = 0;
    handler.async = async;
    this.handlers.push(handler);

    var registry = this.registry[verb];
    registry.add([{path: path, handler: handler}]);
  },
  passthrough: PASSTHROUGH,
  checkPassthrough: function(request) {
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
  handleRequest: function handleRequest(request){
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

        this.handleResponse(request, async, function() {
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
    delay = typeof delay === 'boolean' ? delay : (typeof delay === 'number' ? delay : 0);

    if (delay === false) {
      callback();
    } else {
      var pretender = this;
      pretender.requestReferences.push({
        request: request,
        callback: callback
      });

      if (delay !== true) {
        scheduleProgressEvents(request, delay);
        setTimeout(function() {
          pretender.resolve(request);
        }, delay);
      }
    }
  },
  resolve: function resolve(request) {
    for(var i = 0, len = this.requestReferences.length; i < len; i++) {
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
  handledRequest: function(verb, path, request) { /* no-op */},
  passthroughRequest: function(verb, path, request) { /* no-op */},
  unhandledRequest: function(verb, path, request) {
    throw new Error("Pretender intercepted "+verb+" "+path+" but no handler was defined for this type of request");
  },
  erroredRequest: function(verb, path, request, error){
    error.message = "Pretender intercepted "+verb+" "+path+" but encountered an error: " + error.message;
    throw error;
  },
  _handlerFor: function(verb, path, request){
    var registry = this.registry[verb];
    var matches = registry.recognize(path);

    var match = matches ? matches[0] : null;
    if (match) {
      request.params = match.params;
      request.queryParams = matches.queryParams;
    }

    return match;
  },
  shutdown: function shutdown(){
    window.XMLHttpRequest = this._nativeXMLHttpRequest;

    // "stop" the server
    this.running = false;
  }
};

if (isNode) {
  module.exports = Pretender;
} else {
  window.Pretender = Pretender;
}

})(window);
