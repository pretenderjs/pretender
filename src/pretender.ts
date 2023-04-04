import * as FakeFetch from 'whatwg-fetch';
import FakeXMLHttpRequest from 'fake-xml-http-request';
import { Params, QueryParams } from 'route-recognizer';
import { ResponseHandler, ResponseHandlerInstance } from '../index.d';
import Hosts from './hosts';
import parseURL from './parse-url';
import Registry from './registry';
import { interceptor } from './interceptor';

interface ExtraRequestData {
  url: string;
  method: string;
  params: Params;
  queryParams: QueryParams;
}
type FakeRequest = FakeXMLHttpRequest & ExtraRequestData;

type Verb = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

class NoopArray {
  length = 0;
  push(..._items: any[]) {
    return 0;
  }
}

function scheduleProgressEvent(request, startTime, totalTime) {
  let totalSize = 0;
  const body = request.requestBody;
  if (body) {
    if (body instanceof FormData) {
      body.forEach((value) => {
        if (value instanceof File) {
          totalSize += value.size;
        } else {
          totalSize += value.length;
        }
      });
    } else {
      // Support Blob, BufferSource, USVString, ArrayBufferView
      totalSize = body.byteLength || body.size || body.length || 0;
    }
  }
  setTimeout(function () {
    if (!request.aborted && !request.status) {
      let elapsedTime = new Date().getTime() - startTime.getTime();
      let progressTransmitted =
        totalTime <= 0 ? 0 : (elapsedTime / totalTime) * totalSize;
      // ProgressEvent expects loaded, total
      // https://xhr.spec.whatwg.org/#interface-progressevent
      request.upload._progress(true, progressTransmitted, totalSize);
      request._progress(true, progressTransmitted, totalSize);
      scheduleProgressEvent(request, startTime, totalTime);
    } else if (request.status) {
      // we're done, send a final progress event with loaded === total
      request.upload._progress(true, totalSize, totalSize);
      request._progress(true, totalSize, totalSize);
    }
  }, 50);
}

function isArray(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
}

const PASSTHROUGH = {};

function verbify(verb: Verb) {
  return function (
    this: Pretender,
    path: string,
    handler: ResponseHandler,
    async: boolean
  ) {
    return this.register(verb, path, handler, async);
  };
}

export default class Pretender {
  static parseURL = parseURL;
  static Hosts = Hosts;
  static Registry = Registry;

  hosts = new Hosts();
  handlers: ResponseHandler[] = [];
  handledRequests: any[] | NoopArray;
  passthroughRequests: any[] | NoopArray;
  unhandledRequests: any[] | NoopArray;
  requestReferences: any[];
  forcePassthrough: boolean;
  disableUnhandled: boolean;

  ctx: { pretender?: Pretender };
  running: boolean;

  private _nativeXMLHttpRequest: any;
  private _fetchProps: string[];

  constructor() {
    let lastArg = arguments[arguments.length - 1];
    let options = typeof lastArg === 'object' ? lastArg : null;
    let shouldNotTrack = options && options.trackRequests === false;

    this.handledRequests = shouldNotTrack ? new NoopArray() : [];
    this.passthroughRequests = shouldNotTrack ? new NoopArray() : [];
    this.unhandledRequests = shouldNotTrack ? new NoopArray() : [];
    this.requestReferences = [];
    this.forcePassthrough = options && options.forcePassthrough === true;
    this.disableUnhandled = options && options.disableUnhandled === true;

    // reference the native XMLHttpRequest object so
    // it can be restored later
    this._nativeXMLHttpRequest = (<any>self).XMLHttpRequest;
    this.running = false;
    let ctx = { pretender: this };
    this.ctx = ctx;

    // capture xhr requests, channeling them into
    // the route map.
    (<any>self).XMLHttpRequest = interceptor(ctx);

    // polyfill fetch when xhr is ready
    if (!self.fetch) {
      this._fetchProps = FakeFetch
        ? ["fetch", "Headers", "Request", "Response"]
        : [];
      this._fetchProps.forEach((name) => {
        (<any>this)["_native" + name] = self[name];
        self[name] = FakeFetch[name];
      }, this);
    }

    // 'start' the server
    this.running = true;

    // trigger the route map DSL.
    let argLength = options ? arguments.length - 1 : arguments.length;
    for (let i = 0; i < argLength; i++) {
      this.map(arguments[i]);
    }
  }

  get = verbify('GET');
  post = verbify('POST');
  put = verbify('PUT');
  delete = verbify('DELETE');
  patch = verbify('PATCH');
  head = verbify('HEAD');
  options = verbify('OPTIONS');

  map(maps: (pretender: Pretender) => void) {
    maps.call(this);
  }

  register(
    verb: string,
    url: string,
    handler: ResponseHandler,
    async: boolean
  ): ResponseHandlerInstance {
    if (!handler) {
      throw new Error(
        'The function you tried passing to Pretender to handle ' +
          verb +
          ' ' +
          url +
          ' is undefined or missing.'
      );
    }

    const handlerInstance = handler as ResponseHandlerInstance;

    handlerInstance.numberOfCalls = 0;
    handlerInstance.async = async;
    this.handlers.push(handlerInstance);

    let registry = this.hosts.forURL(url)[verb];

    registry.add([
      {
        path: parseURL(url).fullpath,
        handler: handlerInstance,
      },
    ]);

    return handlerInstance;
  }

  passthrough = PASSTHROUGH;

  checkPassthrough(request: FakeRequest) {
    let verb = request.method.toUpperCase() as Verb;
    let path = parseURL(request.url).fullpath;
    let recognized = this.hosts.forURL(request.url)[verb].recognize(path);
    let match = recognized && recognized[0];

    if ((match && match.handler === PASSTHROUGH) || this.forcePassthrough) {
      this.passthroughRequests.push(request);
      this.passthroughRequest(verb, path, request);
      return true;
    }

    return false;
  }

  handleRequest(request: FakeRequest) {
    let verb = request.method.toUpperCase();
    let path = request.url;

    let handler = this._handlerFor(verb, path, request);

    if (handler) {
      handler.handler.numberOfCalls++;
      let async = handler.handler.async;
      this.handledRequests.push(request);

      let pretender = this;

      let _handleRequest = function (statusHeadersAndBody) {
        if (!isArray(statusHeadersAndBody)) {
          let note =
            'Remember to `return [status, headers, body];` in your route handler.';
          throw new Error(
            'Nothing returned by handler for ' + path + '. ' + note
          );
        }

        let status = statusHeadersAndBody[0];
        let headers = pretender.prepareHeaders(statusHeadersAndBody[1]);
        let body = pretender.prepareBody(statusHeadersAndBody[2], headers);

        pretender.handleResponse(request, async, function () {
          request.respond(status, headers, body);
          pretender.handledRequest(verb, path, request);
        });
      };

      try {
        let result = handler.handler(request);
        if (result && typeof result.then === 'function') {
          // `result` is a promise, resolve it
          result.then(function (resolvedResult) {
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
  }

  handleResponse(request: FakeRequest, strategy, callback: Function) {
    let delay = typeof strategy === 'function' ? strategy() : strategy;
    delay = typeof delay === 'boolean' || typeof delay === 'number' ? delay : 0;

    if (delay === false) {
      callback();
    } else {
      let pretender = this;
      pretender.requestReferences.push({
        request: request,
        callback: callback,
      });

      if (delay !== true) {
        scheduleProgressEvent(request, new Date(), delay);
        setTimeout(function () {
          pretender.resolve(request);
        }, delay);
      }
    }
  }

  resolve(request: FakeRequest) {
    for (let i = 0, len = this.requestReferences.length; i < len; i++) {
      let res = this.requestReferences[i];
      if (res.request === request) {
        res.callback();
        this.requestReferences.splice(i, 1);
        break;
      }
    }
  }

  requiresManualResolution(verb: string, path: string) {
    let handler = this._handlerFor(verb.toUpperCase(), path, {});
    if (!handler) {
      return false;
    }

    let async = handler.handler.async;
    return typeof async === 'function' ? async() === true : async === true;
  }
  prepareBody(body, _headers) {
    return body;
  }
  prepareHeaders(headers) {
    return headers;
  }
  handledRequest(_verb, _path, _request) {
    /* no-op */
  }
  passthroughRequest(_verb, _path, _request) {
    /* no-op */
  }
  unhandledRequest(verb, path, _request) {
    throw new Error(
      'Pretender intercepted ' +
        verb +
        ' ' +
        path +
        ' but no handler was defined for this type of request'
    );
  }
  erroredRequest(verb, path, _request, error) {
    error.message =
      'Pretender intercepted ' +
      verb +
      ' ' +
      path +
      ' but encountered an error: ' +
      error.message;
    throw error;
  }
  shutdown() {
    (<any>self).XMLHttpRequest = this._nativeXMLHttpRequest;
    this._fetchProps.forEach((name) => {
      self[name] = this['_native' + name];
    }, this);
    this.ctx.pretender = undefined;
    // 'stop' the server
    this.running = false;
  }

  private _handlerFor(verb: Verb, url: string, request: FakeRequest) {
    let registry = this.hosts.forURL(url)[verb];
    let matches = registry.recognize(parseURL(url).fullpath);

    let match = matches ? matches[0] : null;
    if (match) {
      request.params = match.params;
      request.queryParams = matches.queryParams;
    }

    return match;
  }
}
