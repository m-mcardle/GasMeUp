# Claude Context

Use `AGENTS.md` as the canonical repository guide for this project.

For focused work, prefer the nearest package guide as well:

- `app/AGENTS.md`
- `server/AGENTS.md`
- `functions/AGENTS.md`
- `firebase-admin/AGENTS.md`

High-signal repo facts:

- This is a multi-package repo with no root `package.json`.
- The mobile client is Expo/React Native in `app/`.
- The backend API is Express in `server/`.
- Firestore-triggered logic lives in `functions/`.
- Admin migrations live in `firebase-admin/`.
- The `Users.friends` schema and `Transactions` payload shape are the most important cross-package invariants.
