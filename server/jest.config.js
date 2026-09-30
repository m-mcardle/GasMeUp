// `npm test`       -> hermetic project only (all outbound HTTP mocked with fixtures)
// `npm run test:live` -> live project (real Google / RapidAPI / fueleconomy.gov calls; needs .env)
module.exports = {
  projects: [
    {
      displayName: 'hermetic',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/hermetic/**/*.test.js'],
    },
    {
      displayName: 'live',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/live/**/*.test.js'],
    },
  ],
};
