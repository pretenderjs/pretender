import FakeXMLHttpRequest from 'fake-xml-http-request';
import { createPassthrough } from './create-passthrough';

export function interceptor(ctx) {
  function FakeRequest(this: any) {
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
      this.passthrough();
    } else {
      ctx.pretender.handleRequest(this);
    }
  };

  FakeRequest.prototype.passthrough = function passthrough() {
    if (!this.sendArguments) {
      throw new Error('You attempted to passthrough a FakeRequest that was never sent. ' +
            'Call `.send()` on the original request first');
    }
    var xhr = createPassthrough(this, ctx.pretender._nativeXMLHttpRequest);
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
