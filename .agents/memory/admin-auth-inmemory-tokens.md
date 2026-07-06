---
name: Admin auth tokens are in-memory
description: Why admin sessions in the jardineria API server get invalidated on restart
---

The jardineria admin API (`artifacts/api-server/src/routes/admin.ts`) stores issued
admin/cert bearer tokens in in-memory `Set`s (`adminTokens`, `certTokens`), not in the
database or a persisted session store.

**Why:** Simplest possible auth for a small admin panel with a single shared
username/password — no session table needed.

**How to apply:** Any `pnpm restart`/workflow restart of the API server clears these
sets, so previously-logged-in admin browser sessions start failing with
"Token inválido o expirado" on their next request. This is expected — the fix is
just to log in again, not to chase it as a bug. Keep this in mind when restarting
the API server workflow while testing admin features (existing test tokens fetched
before a restart become invalid).
