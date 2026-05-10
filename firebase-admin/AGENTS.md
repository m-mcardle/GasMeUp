# Firebase Admin Agent Guide

This directory contains one-off Firebase Admin scripts and migrations for GasMeUp data.

## Purpose

Use this package for controlled backfills or schema migrations, not for normal request handling.

Current operations include:

- migrating the `Users.friends` structure up/down
- creating `SecureUsers`
- repairing broken nested friend balances

## Stack

- TypeScript
- Firebase Admin SDK
- Google Application Default Credentials

## Entry Points

- Script dispatcher: `src/index.ts`
- Migrations:
  - `src/migrations/FriendsStructure.ts`
  - `src/migrations/CreateSecureUsersTable.ts`
  - `src/migrations/BrokenBalance.ts`

## Commands

Run from this directory:

- `npm install`
- `npm run build`
- `npm start -- up`
- `npm start -- down`
- `npm start -- secureup`
- `npm start -- securedown`
- `npm start -- unbreak`

## Credential Model

This package initializes Firebase Admin with `applicationDefault()`.

Before running any migration:

- make sure your Google credentials point at the intended project
- confirm whether you mean development or production
- inspect the migration logic line by line

## Editing Guidance

- Treat every script here as production-affecting unless proven otherwise.
- Prefer additive migrations and explicit logs over implicit transformations.
- Batch operations touch every user document; be careful about memory and write limits if you expand them.
- If you introduce a new schema migration, document both the forward and rollback path when possible.

## Validation

- `npm run build` is the main automated check.
- There are no tests.
- If you are changing a migration, review the transformed shape manually against Firestore expectations in the app and functions packages.
