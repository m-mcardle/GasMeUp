// Runs before every hermetic test file. Pin the Google Maps mode so a developer's
// shell (or .env) can't silently switch suites; files that exercise the new APIs
// set GOOGLE_MAPS_API=new themselves.
process.env.GOOGLE_MAPS_API = 'legacy';
