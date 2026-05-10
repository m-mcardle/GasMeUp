# GitHub Copilot Instructions For GasMeUp

GasMeUp is a multi-package mobile app repository. There is no root workspace package, so run commands from the relevant subdirectory:

- `app/`: Expo + React Native TypeScript client
- `server/`: Node 20 + Express API
- `functions/`: Firebase Cloud Functions on Node 16
- `firebase-admin/`: one-off Firebase Admin migration scripts

Important project rules:

- Keep API response shapes stable unless you also update the mobile client and server tests.
- Use `app/src/data/data.ts` for app-to-server requests instead of hardcoding URLs.
- App runtime env is injected through `app/app.config.js` and consumed from `app/src/helpers/env.ts`.
- Firebase Remote Config controls feature flags and even tab visibility.
- The `Users.friends` Firestore map is a core invariant shared across `app/`, `functions/`, and `firebase-admin/`.
- `Transactions` writes trigger balance aggregation and notifications in `functions/index.ts`.
- If you change Firestore payload shape, keep `app/types.d.ts` and `functions/global.d.ts` aligned.
- Be careful in `functions/`: the runtime is Node 16, not Node 20.
- Push notifications, Apple auth, and background location depend on native/mobile platform constraints.

Preferred validation:

- App: `cd app && npm run lint && npm run check-types`
- Server: `cd server && npm test`
- Functions: `cd functions && npm run build && npm run lint`
- Firebase Admin: `cd firebase-admin && npm run build`

Read `AGENTS.md` for the full repository guide and the package-local `AGENTS.md` files for focused instructions.
