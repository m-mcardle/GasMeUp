# GasMeUp Agent Guide

This repository contains the full GasMeUp product stack:

- `app/`: Expo + React Native mobile client written in TypeScript.
- `server/`: Express API that powers maps, routing, gas price, and vehicle data.
- `functions/`: Firebase Cloud Functions triggered by Firestore changes and a few HTTP handlers.
- `firebase-admin/`: one-off Firebase Admin scripts and migrations.

There is no root workspace package. Run install, lint, test, and build commands from the relevant subdirectory.

## Product Overview

GasMeUp helps users calculate trip fuel cost, save trips, and split balances with friends. The mobile app uses:

- Firebase Auth for login.
- Firestore for `Users` and `Transactions`.
- Firebase Analytics for event and screen logging.
- Firebase Remote Config for feature flags and server URL selection.
- Expo Notifications and location APIs.

The app calls the Express API for:

- Place autocomplete and geocoding.
- Route distance and map data.
- Gas price lookup.
- Vehicle year/make/model/fuel economy lookup.

Cloud Functions react to Firestore writes to:

- send push notifications for new trips and settle-ups.
- aggregate friend balances when a `Transactions` document is created.
- keep both sides of the `Users.friends` map in sync.

## Repository Map

### `app/`

- Entry point: `app/App.tsx`
- Tab navigation: `app/src/screens/HomeTab.tsx`, `app/src/screens/FriendsTab.tsx`
- Shared state: `app/src/hooks/hooks.tsx`
- Remote Config defaults: `app/src/data/remote_config_defaults.json`
- API fetch helper: `app/src/data/data.ts`
- Firebase client init: `app/firebase.js`
- Env bridge into Expo config: `app/app.config.js`

### `server/`

- API entry point: `server/src/index.js`
- Google API request builders: `server/src/queries/google.js`
- Gas price request builders: `server/src/queries/gasprice.js`
- Fuel economy request builders: `server/src/queries/fueleconomy.js`
- API key validation: `server/src/utils/validation.js`
- Tests: `server/test/` (hermetic suite run by `npm test`; live-API suite in `test/live` run by `npm run test:live`)
- Deployment target: Google App Engine via `server/app.yaml`

### `functions/`

- Main entry point: `functions/index.ts`
- Friend sync logic: `functions/src/friends.ts`
- Push notification payloads: `functions/src/notificationMessages.ts`
- Shared Firestore types: `functions/global.d.ts`

### `firebase-admin/`

- Script entry point: `firebase-admin/src/index.ts`
- Migrations:
  - `firebase-admin/src/migrations/FriendsStructure.ts`
  - `firebase-admin/src/migrations/CreateSecureUsersTable.ts`
  - `firebase-admin/src/migrations/BrokenBalance.ts`

## Common Commands

### App

Run from `app/`:

- `npm install`
- `npm run start`
- `npm run ios`
- `npm run android`
- `npm run lint`
- `npm run check-types`

Useful build/deploy scripts:

- `npm run build:dev`
- `npm run build`
- `npm run publish`
- `npm run publish:expo`

### Server

Run from `server/`:

- `npm install`
- `npm run dev`
- `npm run start`
- `npm test`

Deploy:

- `npm run deploy`
- `npm run deploy-dev`

### Functions

Run from `functions/`:

- `npm install`
- `npm run build`
- `npm run lint`
- `npm run serve`
- `npm run shell`

Deploy:

- `npm run deploy`
- `npm run deploy:prod`

### Firebase Admin

Run from `firebase-admin/`:

- `npm install`
- `npm run build`
- `npm start -- up`
- `npm start -- down`
- `npm start -- secureup`
- `npm start -- securedown`
- `npm start -- unbreak`

## Environment And Secrets

### App env surface

The mobile app does not read `.env` directly from runtime code. Values are injected through `app/app.config.js` into `Constants.expoConfig.extra`, then consumed in `app/src/helpers/env.ts`.

App-related env vars used in code:

- `FIREBASE_API_KEY`
- `PROD_FIREBASE_API_KEY`
- `API_KEY`
- `USE_DEV_API`
- `DEV_API_URL`
- `GOOGLE_IOS_SDK_KEY`
- `SPLITWISE_CLIENT_ID`
- `DEV_SPLITWISE_CLIENT_ID`

### Server env surface

`server/.env.sample` lists every variable the server reads. Key ones:

- `GOOGLE_API_KEY`
- `RAPID_API_KEY`
- `CLIENT_API_KEY`
- `PORT` (optional, defaults to `3001`)

### Functions env surface

There is no checked-in sample file for `functions/`. The code also expects access to an Apple private key file named `B34ZDLHVDF.p8` for the Apple token helper endpoints in `functions/index.ts`.

### Firebase Admin credentials

`firebase-admin/` initializes via `applicationDefault()`. Run it only with valid Google application default credentials for the intended Firebase project.

## Architecture Notes

### Mobile app flow

- `App.tsx` sets up fonts, notifications, background location subscription, Remote Config, analytics screen logging, and bottom tabs.
- Tab visibility is feature-flagged. Do not assume a screen is always reachable even if it exists in code.
- `HomeTab` contains trip calculation and trip saving flows.
- `FriendsTab` gates the friends UI behind Firebase Auth and uses Firestore hooks heavily.
- `app/src/data/data.ts` chooses the backend URL from:
  - `ENV.DEV_API_URL` when `USE_DEV_API === 'true'`
  - otherwise Remote Config key `server_url`

### Remote Config behavior

Default keys live in `app/src/data/remote_config_defaults.json`. Current defaults include:

- screen toggles such as `home_screen`, `friends_screen`, `gas_screen`, `car_screen`
- operational toggles like `maintenance_mode`, `manual_trip_tracking`
- backend config like `server_url`

If you add a feature flag, update:

- the default JSON file
- code paths that consume it
- any server or product expectations tied to it

### Firestore data invariants

The most important schema invariant is the `Users.friends` object:

- keys are usually friend UIDs.
- temporary placeholder keys may exist briefly during outgoing friend request creation.
- values should match the `Friend` shape:
  - `status`: `'outgoing' | 'incoming' | 'accepted'`
  - `accepted`: boolean
  - `balance`: number
  - `email?`: string

Balance semantics are user-relative:

- positive balance on `user.friends[friendUid].balance` means that friend owes the current user.
- negative balance means the current user owes that friend.

`Transactions` writes trigger the balance aggregation function. If you change transaction shape or split logic, update both the app and the functions layer together.

### Friend request lifecycle

The current design is split between frontend writes and Cloud Functions:

1. The app creates an outgoing friend entry on the current user.
2. `functions/src/friends.ts` resolves the email to a real user and mirrors an incoming request onto the other user.
3. The receiving user accepts by changing status to `accepted`.
4. Cloud Functions mirror the accepted state back.
5. Removing friends can trigger mirrored cleanup on the opposite user.

Be careful with direct writes to `Users.friends`; one-sided edits are often only half of the intended workflow.

## Editing Guardrails

- Keep server response shapes stable. The mobile client parses exact field names like `price`, `prices`, `distance`, `start`, `end`, `modelOptions`, and `mpg`.
- If you change API params or response shapes in `server/src/index.js`, update the app consumer and the contract tests in `server/test/`.
- The app uses both TypeScript and global `.d.ts` types. Keep `app/types.d.ts` and `functions/global.d.ts` aligned when changing Firestore payloads.
- `functions/` targets Node 22 (the maximum for 1st-gen functions) with firebase-functions 7 imported as `firebase-functions/v1`. Moving to Node 24 requires a gen2 migration (delete + recreate of every function).
- `server/` runs on Node 24 (App Engine `nodejs24`) with Express 5 and uses CommonJS.
- Some repo docs are stale. Prefer package manifests and code over README instructions when they disagree.
- Several features depend on native capabilities:
  - push notifications generally require a physical device.
  - background location requires native config and permissions.
  - Apple login/token flows need Apple-specific credentials.
- If you add a new environment variable for the app, wire it through `app/app.config.js` and `app/src/helpers/env.ts`.
- If you change Firestore schema, consider whether `firebase-admin/` needs a migration script.

## Testing Expectations

- App: linting and type-checking are the main fast checks.
- Server: `npm test` is hermetic (mocked upstreams, contract assertions on every route, both `GOOGLE_MAPS_API` modes); `npm run test:live` hits real APIs and needs `server/.env`.
- Firestore rules + functions: `rules-tests/` runs an emulator suite (`PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm test`, needs Java 21). Run it after any change to `firestore.rules` or `functions/`.
- Functions: lint/build are available, but there are no meaningful automated tests checked in.
- Firebase Admin: no tests; review scripts carefully before running them against real data.

## Known Sharp Edges

- `app/src/screens/Home/HomeScreen.tsx` still uses `LocationInputOld`.
- Server tests are not pure unit tests; they depend on real external API configuration.
- The root README describes commands conceptually, but this repo does not have a root `package.json`.

## Package-Local Guides

For focused work, also read:

- `app/AGENTS.md`
- `server/AGENTS.md`
- `functions/AGENTS.md`
- `firebase-admin/AGENTS.md`
