## v3.4.3 (2020-05-19)

#### :memo: Documentation
* [#302](https://github.com/pretenderjs/pretender/pull/302) Publish pretender.bundle.js bundling dependencies ([@xg-wang](https://github.com/xg-wang))

#### Committers: 1
- Thomas Wang ([@xg-wang](https://github.com/xg-wang))


## v3.4.2 (2020-05-19)

#### :bug: Bug Fix
* [#304](https://github.com/pretenderjs/pretender/pull/304) Don't attach upload handler if they do not exist on the originating request ([@ryanto](https://github.com/ryanto))

#### Committers: 2
- Ryan T ([@ryanto](https://github.com/ryanto))


## v3.4.1 (2020-04-20)

#### :bug: Bug Fix
* [#299](https://github.com/pretenderjs/pretender/pull/299) fix: passThroughRequest typo ([@mattrothenberg](https://github.com/mattrothenberg))

#### :house: Internal
* [#257](https://github.com/pretenderjs/pretender/pull/257) refactor: extract create-passthrough & interceptor ([@givanse](https://github.com/givanse))
* [#256](https://github.com/pretenderjs/pretender/pull/256) refactor: extract hosts ([@givanse](https://github.com/givanse))

#### Committers: 2
- Gastón I. Silva ([@givanse](https://github.com/givanse))
- Matt Rothenberg ([@mattrothenberg](https://github.com/mattrothenberg))

## v3.4.0 (2020-03-21)

#### :rocket: Enhancement
* [#296](https://github.com/pretenderjs/pretender/pull/296) Vendor whatwg-fetch using rollup+devDep ([@ryanto](https://github.com/ryanto))

#### :house: Internal
* [#294](https://github.com/pretenderjs/pretender/pull/294) Upgrade devDependencies and CI ([@xg-wang](https://github.com/xg-wang))

#### Committers: 2
- Ryan T ([@ryanto](https://github.com/ryanto))
- Thomas Wang ([@xg-wang](https://github.com/xg-wang))

## v3.3.1 (2020-02-09)

#### :bug: Bug Fix
* [#291](https://github.com/pretenderjs/pretender/pull/291) Fix typo in type defs ([@mfeckie](https://github.com/mfeckie))
* [#290](https://github.com/pretenderjs/pretender/pull/290) Removes unnecessary url-parse required from iife-wrapper ([@eluciano11](https://github.com/eluciano11))

#### Committers: 2
- Emmanuel Luciano ([@eluciano11](https://github.com/eluciano11))
- Martin Feckie ([@mfeckie](https://github.com/mfeckie))

## v3.3.0 (2020-02-07)

#### :rocket: Enhancement
* [#288](https://github.com/pretenderjs/pretender/pull/288) Adds url parse and removes the usage of anchor ([@eluciano11](https://github.com/eluciano11))

#### Committers: 2
- Emmanuel Luciano ([@eluciano11](https://github.com/eluciano11))
- Ryan Stelly ([@FLGMwt](https://github.com/FLGMwt))

## 3.2.0 (2019-12-22)

#### :rocket: Enhancement
* [#238](https://github.com/pretenderjs/pretender/pull/238) Expose a way to passthrough after the request is found to be unhandled ([@happycollision](https://github.com/happycollision))

#### Committers: 1
- Don Denton ([@happycollision](https://github.com/happycollision))

## 3.1.0 (2019-11-28)

#### :rocket: Enhancement
* [#280](https://github.com/pretenderjs/pretender/pull/280) support FakeXMLHttpRequest response property ([@kellyselden](https://github.com/kellyselden))

#### Committers: 1
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))

## 3.0.4 (2019-11-04)

#### :bug: Bug Fix
* [#279](https://github.com/pretenderjs/pretender/pull/279) fix: remove node engine constraint ([@xg-wang](https://github.com/xg-wang))

#### Committers: 1
- Thomas Wang ([@xg-wang](https://github.com/xg-wang))

## 3.0.3 (2019-11-03)

#### :bug: Bug Fix
* [#278](https://github.com/pretenderjs/pretender/pull/278) Add missing type definitions in index.d.ts ([@ohcibi](https://github.com/ohcibi))
* [#276](https://github.com/pretenderjs/pretender/pull/276) fix: progress event expects byte size not time ([@xg-wang](https://github.com/xg-wang))

#### Committers: 2
- Thomas Wang ([@xg-wang](https://github.com/xg-wang))
- Tobias Witt ([@ohcibi](https://github.com/ohcibi))

## 3.0.2

#### :bug: Bug Fix
  * [262](https://github.com/pretenderjs/pretender/pull/262) Fix ResponseHandler args type
  * [264](https://github.com/pretenderjs/pretender/pull/264) Fix missing responseURL property
  * [265](https://github.com/pretenderjs/pretender/pull/265) Fix passthrough type

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
