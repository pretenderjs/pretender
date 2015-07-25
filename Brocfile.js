var pickFiles = require('broccoli-static-compiler');
var compileModules = require('broccoli-babel-transpiler');
var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-concat');
var path = require('path');

var libTreeES6 = pickFiles('lib', {
  srcDir: '/',
  files: ['pretender.js'],
  destDir: '/'
});

var testsTreeES6 = pickFiles('test', {
  srcDir: '/',
  files: ['**/*test.js'],
  destDir: '/'
});

var libTreeUMD = compileModules(libTreeES6, {
  modules: 'umd'
});

var testTreeUMD = compileModules(testsTreeES6, {
  modules: 'umd'
});

var libOutputUMD = concat(libTreeUMD, {
  inputFiles: [ '**/*.js' ],
  outputFile: '/pretender.js'
});

var testOutputUMD = concat(testTreeUMD, {
  inputFiles: [ '**/*.js' ],
  outputFile: '/test/tests.js'
});

var cpToTest = function(absPath) {
  var dir = path.dirname(absPath);
  var filename = path.basename(absPath);
  return pickFiles(dir, {
    srcDir: '/',
    files: [filename],
    destDir: '/test'
  });
}

var dependencies = mergeTrees([
  cpToTest('node_modules/qunitjs/qunit/qunit.js'),
  cpToTest('node_modules/qunitjs/qunit/qunit.css'),
  cpToTest('bower_components/jquery/dist/jquery.js'),
  cpToTest('bower_components/route-recognizer/dist/route-recognizer.js'),
  cpToTest('bower_components/FakeXMLHttpRequest/fake_xml_http_request.js')
]);

var testIndex = cpToTest('test/index.html');

module.exports = mergeTrees([
  dependencies,
  testIndex,
  testOutputUMD,
  libOutputUMD
]);
