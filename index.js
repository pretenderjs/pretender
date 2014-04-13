var forEach = [].forEach;

function Pretender(maps){
  // Herein we keep track of RouteRecognizer instances
  // keyed by HTTP method
  this.registry = {};

  this.defaultHeaders = {};

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
    var registry = this.registry[verb] = this.registry[verb] || new RouteRecognizer();
    registry.add([{path: path, handler: handler}])
  },
  handleRequest: function handleRequest(request){
    var registry = this.registry[request.method],
        match = registry.recognize(request.url)[0];
    if (match) {
      request.params = match.params;
      request.respond.apply(request, match.handler(request));
    } else {
      request.reply(404, {}, "");
    }
  },
  shutdown: function shutdown(){
    window.XMLHttpRequest = this._nativeXMLHttpRequest
  }
}
