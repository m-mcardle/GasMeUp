// Runs before every hermetic test file (each file gets its own copy of process.env).
//
// src/index.js calls dotenv.config(), which fills in any variable that is not
// already present from a developer's server/.env. Pre-set every variable the
// server reads to '' (treated as "not configured") so real keys can never leak
// into, or change the outcome of, a hermetic test; suites set what they need.
[
  'CLIENT_API_KEY',
  'GOOGLE_API_KEY',
  'RAPID_API_KEY',
  'EXCHANGE_RATE_API_KEY',
  'SPLITWISE_CLIENT_ID',
  'SPLITWISE_CONSUMER_SECRET',
  'DEV_SPLITWISE_CLIENT_ID',
  'DEV_SPLITWISE_CONSUMER_SECRET',
].forEach((key) => { process.env[key] = ''; });

// Pin the Google Maps mode so a developer's shell (or .env) can't silently switch
// suites; files that exercise the new APIs set GOOGLE_MAPS_API=new themselves.
process.env.GOOGLE_MAPS_API = 'legacy';
