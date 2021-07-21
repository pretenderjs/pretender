export function createPassthrough(fakeXHR, nativeXMLHttpRequest) {
  // event types to handle on the xhr
  var evts = ['error', 'timeout', 'abort', 'readystatechange'];

  // event types to handle on the xhr.upload
  var uploadEvents = [];

  // properties to copy from the native xhr to fake xhr
  var lifecycleProps = [
    'readyState',
    'responseText',
    'response',
    'responseXML',
    'responseURL',
    'status',
    'statusText',
  ];

  var xhr = (fakeXHR._passthroughRequest = new nativeXMLHttpRequest());
  xhr.open(
    fakeXHR.method,
    fakeXHR.url,
    fakeXHR.async,
    fakeXHR.username,
    fakeXHR.password
  );

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
    xhr['on' + eventType] = function (event) {
      copyLifecycleProperties(lifecycleProps, xhr, fakeXHR);
      dispatchEvent(fakeXHR, eventType, event);
    };
  }

  // set the on- handler on the native xhr's `upload` property for
  // the given eventType
  function createUploadHandler(eventType) {
    if (xhr.upload && fakeXHR.upload && fakeXHR.upload['on' + eventType]) {
      xhr.upload['on' + eventType] = function (event) {
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
  if (!xhr.timeout) {
    xhr.timeout = 0; // default XMLHttpRequest timeout
  }
  for (var h in fakeXHR.requestHeaders) {
    xhr.setRequestHeader(h, fakeXHR.requestHeaders[h]);
  }
  return xhr;
}
