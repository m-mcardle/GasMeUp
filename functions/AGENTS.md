# Functions Agent Guide

This directory contains Firebase Cloud Functions for GasMeUp.

## Purpose

These functions keep Firestore-derived state in sync and send notifications when trip/friend activity occurs.

Main responsibilities:

- send push notifications when a `Transactions` document is created
- aggregate friend balances from transaction writes
- mirror and clean up friend relationships on `Users` document changes
- expose Apple token helper HTTP endpoints

## Stack

- Firebase Cloud Functions
- TypeScript
- Firebase Admin SDK
- Expo Server SDK
- Node.js 16 runtime

## Entry Points

- Main file: `index.ts`
- Friend sync logic: `src/friends.ts`
- Push payload builders: `src/notificationMessages.ts`
- Shared type declarations: `global.d.ts`

## Commands

Run from this directory:

- `npm install`
- `npm run build`
- `npm run lint`
- `npm run serve`
- `npm run shell`
- `npm run logs`

Deploy:

- `npm run deploy`
- `npm run deploy:prod`

## Firebase Project Selection

Firebase project aliases are defined at the repo root in `.firebaserc`:

- `default` / `development`: `northern-bot-301518`
- `production`: `gasmeup-7ce5f`

Be explicit about which environment you are targeting before deploys or local shells.

## Firestore Invariants

The most important schema here is `Users.friends`.

Expected value shape:

- `status`: `'outgoing' | 'incoming' | 'accepted'`
- `accepted`: boolean
- `balance`: number
- `email?`: string

Important behavior:

- outgoing friend requests may start with a temporary placeholder key until the function resolves the target user by email.
- accepting or removing a friend is mirrored across both users by Cloud Functions.
- `Transactions` creation mutates both the payee and payer documents inside a Firestore transaction.

If you change any of these rules, check the app flows in `app/src/screens/Friends/` and the admin migrations in `firebase-admin/`.

## Editing Guidance

- Keep the friend-sync logic symmetric. One-sided updates usually create data drift.
- Preserve idempotency where possible. These handlers can be triggered more than once.
- Avoid Node 18/20-only APIs unless you also upgrade the functions runtime and deploy settings.
- If you change transaction payload shape, update:
  - `functions/global.d.ts`
  - app-side type declarations
  - any code that constructs Firestore transaction documents

## Local And Secret Requirements

- Builds output to `lib/`, which is ignored by eslint.
- Apple token helper endpoints in `index.ts` read a local private key file named `B34ZDLHVDF.p8`.
- The Apple team ID, key ID, and bundle ID are currently hardcoded in `index.ts`; treat that file as sensitive.

## Validation

Use these checks after edits:

- `npm run build`
- `npm run lint`

There are no meaningful automated tests checked in for this package, so rely on careful review and emulator/shell validation.
