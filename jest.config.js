// Create React App-like environment
let browserLikeEnvironmentInNode = {
  displayName: 'browserLikeEnvironmentInNode',
  testEnvironment: 'jsdom',
  testMatch: ['**/test-esm/**/*-test.[jt]s?(x)'],
  moduleNameMapper: {
    'pretender': '<rootDir>/dist/pretender.es.js'
  }
};

// Gatsby-like environment (SSR of client-side code)
let nonBrowserLikeEnvironmentInNode = {
  displayName: 'nonBrowserLikeEnvironmentInNode',
  testEnvironment: 'node',
  testMatch: ['**/test-esm/**/*-test.[jt]s?(x)'],
  moduleNameMapper: {
    'pretender': '<rootDir>/dist/pretender.es.js'
  }
};

module.exports = {
  projects: [
    browserLikeEnvironmentInNode,
    nonBrowserLikeEnvironmentInNode
  ]
};
