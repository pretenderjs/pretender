# Pretender

Pretender is a mock server library in the style of Sinon (but built from microlibs. Because javascript)
that comes with an express/sinatra style syntax for defining routes and their handlers.

Pretender will temporarily replace the native XMLHttpRequest object, intercept all requests, and direct them
to little pretend service you've defined.

```javascript
var PHOTOS = {
  "10": {
    id: 10,
    src: 'http://media.giphy.com/media/UdqUo8xvEcvgA/giphy.gif'
  },
  "42": {
    id: 42,
    src: 'http://media0.giphy.com/media/Ko2pyD26RdYRi/giphy.gif'
  }
};

var server = new Pretender(function(){
  this.get('/photos', function(request){
    var all =  JSON.stringify(Object.keys(PHOTOS).map(function(k){return PHOTOS[k]})
    return [200, {"Content-Type": "application/json"}, all]
  });

  this.get('/photos/:id', function(request){
    return [200, {"Content-Type": "application/json"}, JSON.stringify(FAKE_PHOTOS[request.params.id])]
  });
});

$.get('/photos/12', {success: function(){ ... }})
```


## The Server DSL
The server DSL is inspired by express/sinatra. Pass a function to the Pretender constructor
that will be invoked with the Pretender instance as its context. Available methods are
`get`, `put`, `post`, `'delete'`, `patch`, and `head`. Each of these methods takes a url pattern
and a callback. The callback will be invoked with a single argument (the XMLHttpRequest instance that
triggered this request).

If there were dynamic portions of the url, these well be attached to the request object as a `params`
property with keys matching the dynamic portion and values with the matching value from the url.

You must return an array from this handler that includes the http status code, an object literal
of response headers and a string body.

```javascript
var server = new Pretender(function(){
  this.put('/api/songs/:song_id', function(request){
    request // the xhr object
    request.params // {song_id: 'the id passed in the url'}

    return [202, {"Content-Type": "application/json", "{}"}]
  });
});

```

### Clean up
When you're done mocking, be sure to call `shutdown()` to restore the native XMLHttpRequest object:

```javascript
var server = new Pretender(function(){
 ... routing ...
});

server.shutdown(); // all done.
```
