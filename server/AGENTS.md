# Server Agent Guide

This directory contains the Express backend used by the mobile app.

## Purpose

The server acts as a thin API layer around:

- Google Maps / Places APIs
- the RapidAPI gas-price service
- fueleconomy.gov vehicle endpoints

The mobile client depends on these routes for trip calculation and vehicle data.

## Stack

- Node.js 24 (App Engine `nodejs24`)
- Express 5
- Express
- CommonJS modules
- Axios (no response cache)
- Jest 30 + Supertest: hermetic `npm test`, live `npm run test:live`

## Entry Points

- API server: `src/index.js`
- Request builders:
  - `src/queries/google.js`
  - `src/queries/gasprice.js`
  - `src/queries/fueleconomy.js`
- Helpers:
  - `src/utils/validation.js`
  - `src/utils/console.js`
- Tests: `test/hermetic/` (fixtures in `test/fixtures`, re-record with `node test/fixtures/record.js`), `test/live/`
- Google adapters for the new Places/Routes APIs: `src/adapters/google.js` (selected by `GOOGLE_MAPS_API=new|legacy`, default `legacy`)

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
- `CLIENT_API_KEY` (clients send it as the `x-api-key` header; the `api_key` query param is still accepted for shipped app builds)
- `SPLITWISE_CLIENT_ID`, `SPLITWISE_CONSUMER_SECRET`, `DEV_SPLITWISE_CLIENT_ID`, `DEV_SPLITWISE_CONSUMER_SECRET` (for `POST /splitwise/token`, the server-side OAuth code exchange)
- `EXCHANGE_RATE_API_KEY` (for `GET /exchange-rate`)
- `GOOGLE_MAPS_API` (`legacy` default, or `new`)
- `PORT` (optional)

`server/.env.sample` is complete. App Engine receives env by uploading `server/.env` with the deploy, so deploy from a checkout that has it. The Maps key belongs to the dev project `northern-bot-301518` and is used by prod too.

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
