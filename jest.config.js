module.exports = {
  displayName: 'esm',
  // transformIgnorePatterns: ['<rootDir>/node_modules/(?!lodash)'],
  // setupFilesAfterEnv: ['jest-extended'],
  testMatch: ['**/test-esm/**/*-test.[jt]s?(x)'],
  moduleNameMapper: {
    'pretender': '<rootDir>/dist/pretender.es.js'
  }
};
