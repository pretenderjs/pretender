# Pretender Changelog
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
