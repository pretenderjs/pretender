var forEach = [].forEach;

function Pretender(maps){
  maps = maps || function(){};
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
  var proto = new FakeXMLHttpRequest;
  proto.send = function send(){
    FakeXMLHttpRequest.prototype.send.apply(this, arguments);
    pretender.handleRequest(this)
  };

  FakeRequest.prototype = proto;
  return FakeRequest;
}

function verbify(verb){
  return function(path, handler){
    this.register(verb, path, handler);
  };
}

Pretender.prototype = {
  get: verbify('GET'),
  post: verbify('POST'),
  put: verbify('PUT'),
  'delete': verbify('DELETE'),
  patch: verbify('PATCH'),
  head: verbify('HEAD'),
  register: function register(verb, path, handler){
    handler.numberOfCalls = 0;
    this.handlers.push(handler);

    var registry = this.registry[verb];
    registry.add([{path: path, handler: handler}])
  },
  handleRequest: function handleRequest(request){
    var handler = this._handlerFor(request);

    if (handler) {
      handler.handler.numberOfCalls++;
      this.handledRequests.push(request);
      request.respond.apply(request, handler.handler(request));
    } else {
      this.unhandledRequests.push(request);
      this.unhandledRequest(request.method.toUpperCase(), request.url, request);
    }
  },
  unhandledRequest: function(verb, path, request) {
    throw new Error("Pretender intercepted "+verb+" "+path+" but no handler was defined for this type of request")
  },
  _handlerFor: function(request){
    var registry = this.registry[request.method.toUpperCase()];
    var matches = registry.recognize(request.url);

    var match = matches ? matches[0] : null;
    if (match) {
      request.params = match.params;
      request.queryParams = matches.queryParams;
    }

    return match;
  },
  shutdown: function shutdown(){
    window.XMLHttpRequest = this._nativeXMLHttpRequest
  }
}
