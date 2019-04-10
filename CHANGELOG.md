# Pretender Changelog

## 3.0.1

#### :boom: Breaking Change
  * [241](https://github.com/pretenderjs/pretender/pull/241) Drop Node 4 and 5; add Node 10, 11

#### :rocket: Enhancement
  * [243](https://github.com/pretenderjs/pretender/pull/243) Add build step and TS support. Pretender now exports both iife and es module.
  * [235](https://github.com/pretenderjs/pretender/pull/235) Switch back to offical whatwg-fetch
  * [234](https://github.com/pretenderjs/pretender/pull/234) Enable Abortable fetch

#### :bug: Bug Fix
  * [255](https://github.com/pretenderjs/pretender/pull/255) iife is 100% backwards compatible
  * [254](https://github.com/pretenderjs/pretender/pull/254) Type changes, Allow RequestHandler async param be number, this.passthrough

## 2.1.1
  * cleanup readme and package.json

## 2.1
  * [230](https://github.com/pretenderjs/pretender/pull/230) Support `fetch`

## 2.0
  * **Breaking change**: updated [fake-xml-http-request](https://github.com/pretenderjs/FakeXMLHttpRequest) to 2.0 (dropping support for end-of-life node versions)
  * Improved webpack compatiblity through using module defaults [216](https://github.com/pretenderjs/pretender/pull/216)
  * Added TypeScript type information [223](https://github.com/pretenderjs/pretender/pull/223)

## 1.4.1
  * [188](https://github.com/pretenderjs/pretender/pull/178) Console warn if a second pretender instance is started

## 1.4.0
  * [178](https://github.com/pretenderjs/pretender/pull/178) Warn if a second pretender instance is started
  * [181](https://github.com/pretenderjs/pretender/pull/181) Remove test support for node 0.12
  * [171](https://github.com/pretenderjs/pretender/pull/171) Fix url behavior in IE 11
  * [177](https://github.com/pretenderjs/pretender/pull/177) Allow handlers to return a Promise

## 1.3.0
  * [168](https://github.com/pretenderjs/pretender/pull/168) "Verb" methods now return handler
  * [166](https://github.com/pretenderjs/pretender/pull/166) HTTP `options` request type added

## 1.2.0
  * [#163](https://github.com/pretenderjs/pretender/pull/163) Update the dependency on route-recognizer

## 1.1
  * [#150](https://github.com/pretenderjs/pretender/pull/150) Update the dependency on FakeXMLHttpRequest

## 1.0
  * No changes. Just making the API stable.

## 0.13.0
  * [#148](https://github.com/pretenderjs/pretender/pull/148) Support `ArrayBuffer` responses.

## 0.12.0
  * [#134](https://github.com/pretenderjs/pretender/pull/134) `prepareBody` now receives the headers as a second argument, in case you want to handle something like `Content-Type`

## 0.11.0

 * [#137](https://github.com/pretenderjs/pretender/pull/137) Bump FakeXMLHttpRequest version to 1.3.0 to fix "event is undefined" bug
 * [#130](https://github.com/pretenderjs/pretender/pull/130) Fix readystatechange
 * [#127](https://github.com/pretenderjs/pretender/pull/127) Fix repository URL in package.json
 * [#120](https://github.com/pretenderjs/pretender/pull/120) Moves comment to a more appropriate location
 * [#119](https://github.com/pretenderjs/pretender/pull/119) Fire progress event on xhr.upload in passthrough

## 0.10.1

 * [#118](https://github.com/pretenderjs/pretender/pull/118) bump FakeXMLHttpRequest dependency to ~1.2.1
 * [#117](https://github.com/pretenderjs/pretender/pull/117) ensure xhr callbacks added with `addEventListener` fire on "passthrough"-ed requests
