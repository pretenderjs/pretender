// Karma configuration
// Generated on Thu Oct 06 2016 14:24:14 GMT+0800 (PHT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['qunit', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/FakeXMLHttpRequest/fake_xml_http_request.js',
      'bower_components/route-recognizer/dist/route-recognizer.js',
      'bower_components/jquery-1/index.js',
      'bower_components/jquery/dist/jquery.js',
      'node_modules/es6-promise/dist/es6-promise.auto.js',
      'node_modules/abortcontroller-polyfill/dist/abortcontroller-polyfill-only.js',
      'node_modules/@xg-wang/whatwg-fetch/dist/fetch.umd.js',
      'pretender.js',
      'test/**/*.js'
    ],

    // list of files to exclude
    exclude: [

    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'pretender.js': ['coverage']
    },

    coverageReporter: {
        type: 'lcov',
        dir: 'coverage'
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
