var isNode = typeof process !== 'undefined' && process.toString() === '[object process]';
var RouteRecognizer = isNode ? require('route-recognizer') : window.RouteRecognizer;
var FakeXMLHttpRequest = isNode ? require('./bower_components/FakeXMLHttpRequest/fake_xml_http_request') : window.FakeXMLHttpRequest;
var forEach = [].forEach;

function Pretender(maps){
  maps = maps || function(){};
  this.registry = {};

  this.handlers = [];
  this.handledRequests = [];
  this.unhandledRequests = [];

  // reference the native XMLHttpRequest object so
  // it can be restored later
  this._nativeXMLHttpRequest = window.XMLHttpRequest;

  // capture xhr requests, channeling them into
  // the route map.
  window.XMLHttpRequest = interceptor(this);

  // trigger the route map DSL.
  maps.call(this);
}

function interceptor(pretender) {
  function FakeRequest(){
    // super()
    FakeXMLHttpRequest.call(this);
  }
  // extend
  var proto = new FakeXMLHttpRequest();
  proto.send = function send(){
    FakeXMLHttpRequest.prototype.send.apply(this, arguments);
    pretender.handleRequest(this);
  };

  FakeRequest.prototype = proto;
  return FakeRequest;
}

function verbify(verb){
  return function(url, handler){
    this.register(verb, url, handler);
  };
}

Pretender.prototype = {
  get: verbify('GET'),
  post: verbify('POST'),
  put: verbify('PUT'),
  'delete': verbify('DELETE'),
  patch: verbify('PATCH'),
  head: verbify('HEAD'),
  register: function register(verb, url, handler){
    handler.numberOfCalls = 0;
    this.handlers.push(handler);

    var registry = this._registryFor(verb, url);
    var path = this._splitUrl(url)[1];
    registry.add([{path: path, handler: handler}]);
  },
  handleRequest: function handleRequest(request){
    var verb = request.method.toUpperCase();
    var path = request.url;
    var handler = this._handlerFor(verb, path, request);

    if (handler) {
      handler.handler.numberOfCalls++;
      this.handledRequests.push(request);
      this.handledRequest(verb, path, request);


      try {
        var statusHeadersAndBody = handler.handler(request),
            status = statusHeadersAndBody[0],
            headers = statusHeadersAndBody[1],
            body = this.prepareBody(statusHeadersAndBody[2]);

        request.respond(status, headers, body);
      } catch (error) {
        this.erroredRequest(verb, path, request, error);
      }
    } else {
      this.unhandledRequests.push(request);
      this.unhandledRequest(verb, path, request);
    }
  },
  prepareBody: function(body){ return body; },
  handledRequest: function(verb, path, request){/* no-op */},
  unhandledRequest: function(verb, path, request) {
    throw new Error("Pretender intercepted "+verb+" "+path+" but no handler was defined for this type of request");
  },
  erroredRequest: function(verb, path, request, error){
    error.message = "Pretender intercepted "+verb+" "+path+" but encountered an error: " + error.message;
    throw error;
  },
  _handlerFor: function(verb, url, request){
    var registry = this._registryFor(verb, url);
    var path = this._splitUrl(url)[1];
    var matches = registry.recognize(path);

    var match = matches ? matches[0] : null;
    if (match) {
      request.params = match.params;
      request.queryParams = matches.queryParams;
    }

    return match;
  },
  _registryFor: function(verb, url) {
    var origin = this._splitUrl(url)[0] || window.location.origin;
    this.registry[origin] = this.registry[origin] || {};
    this.registry[origin][verb] = this.registry[origin][verb] || new RouteRecognizer();
    return this.registry[origin][verb];
  },
  _splitUrl: function(url) {
    if (/^(http)/.test(url)) {
      return (url.match(/^(https?\:\/\/[^\/?#]+)(?:[^\/#]*)(.*)/i) || []).slice(1);
    } else {
      return [null, url];
    }
  },
  shutdown: function shutdown(){
    window.XMLHttpRequest = this._nativeXMLHttpRequest;
  }
};

if (isNode) {
  module.exports = Pretender;
}
