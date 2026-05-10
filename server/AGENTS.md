# Server Agent Guide

This directory contains the Express backend used by the mobile app.

## Purpose

The server acts as a thin API layer around:

- Google Maps / Places APIs
- the RapidAPI gas-price service
- fueleconomy.gov vehicle endpoints

The mobile client depends on these routes for trip calculation and vehicle data.

## Stack

- Node.js 20
- Express
- CommonJS modules
- Axios with `axios-cache-adapter`
- Jest + Supertest for tests

## Entry Points

- API server: `src/index.js`
- Request builders:
  - `src/queries/google.js`
  - `src/queries/gasprice.js`
  - `src/queries/fueleconomy.js`
- Helpers:
  - `src/utils/validation.js`
  - `src/utils/console.js`
- Tests: `test/index.test.js`

## Commands

Run from this directory:

- `npm install`
- `npm run dev`
- `npm run start`
- `npm test`

Deploy:

- `npm run deploy`
- `npm run deploy-dev`

## Environment

`src/index.js` and the query builders expect:

- `GOOGLE_API_KEY`
- `RAPID_API_KEY`
- `CLIENT_API_KEY`
- `PORT` (optional)

`server/.env.sample` is not complete for local execution because it does not mention `CLIENT_API_KEY`.

## API Contract

Current routes in `src/index.js`:

- `GET /suggestions`
- `GET /place`
- `GET /geocode`
- `GET /distance`
- `GET /gas-prices`
- `GET /gas`
- `GET /years`
- `GET /makes`
- `GET /models`
- `GET /model-options`
- `GET /vehicle/:vehicleId`

All data routes require `api_key`, validated against `CLIENT_API_KEY`.

## Editing Guidance

- Keep response shapes stable unless you also update the mobile app and tests.
- Avoid large framework refactors unless the task specifically calls for it. This server is intentionally small and direct.
- Preserve CommonJS style unless you are doing a coordinated migration.
- When touching route validation, search the app for the affected route in `app/src/data/data.ts` callers.
- If you change query parameter names, update both test coverage and app callers.

## Testing Notes

- `npm test` runs integration-style tests with live env assumptions.
- Tests rely on valid API keys and can fail if secrets are missing or third-party services change behavior.
- `NODE_ENV=test` prevents the app from listening on a port during tests.

## Deployment Notes

- Production deploy target is Google App Engine, configured by `app.yaml`.
- Runtime is `nodejs20`.

## Known Constraints

- External API latency and availability can affect both tests and runtime behavior.
- The caching layer is minimal and currently configured with a very short max age.
