# SDD: Study PWA hardening (README, hygiene, persistence, install UX)

- **Repo:** `study/next-playground/a_3nextjs-pwa-boilerplate`
- **Status:** `implemented`
- **Date:** 2026-09-23
- **Related:** [000-architecture.md](./000-architecture.md), [001-deps-latest.md](./001-deps-latest.md)

## 1. Context / current architecture

App Router PWA per official Next.js guide: VAPID web-push, `lib/service-worker.js`, in-memory subscription, stale upstream README (Firebase/MUI), `legacy/` archive still present, Install button unwired, TypeScript pinned to 7.x.

## 2. Problem and non-goals

**Problem:** Study repo is confusing and fragile for local push testing.

**Non-goals:**

- Porting Firebase FCM / Google Auth from `legacy/`
- Full Serwist stack (conflicts with guide’s custom SW; use light offline cache in the same SW instead)
- Production multi-tenant subscription DB

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Scope? | **Do all** prior suggestions (2026-09-23) |
| Offline via Serwist? | **No** — extend existing SW with basic precache; document Serwist as future option |

## 4. Proposed approach

1. Rewrite README for current stack + HTTPS / Firefox / macOS notes + mkcert trust
2. Delete `legacy/` and `public/firebase-messaging-sw.js`
3. Persist push subscriptions under `data/subscriptions.json` (gitignored)
4. Install UX: `beforeinstallprompt` on Chromium; hide dead button when not available; keep iOS Share instructions
5. Fail fast if VAPID env missing in server actions
6. `.env.example`; gitignore `data/`, `.env.local`, certificates
7. `engines.node >= 20`; pin `typescript` to `^5.9.2` (Next-compatible major)
8. Basic offline: precache icons + `/` in `lib/service-worker.js`
9. Update `000-architecture.md`

## 5. Acceptance criteria and verification

- [x] README matches App Router + web-push
- [x] No `legacy/` or Firebase messaging SW in `public/`
- [x] Subscribe survives server restart (file on disk)
- [x] Install prompt only actionable when browser fires `beforeinstallprompt` (or iOS copy)
- [x] Missing VAPID returns clear error
- [x] `npm run build` succeeds
- [x] Architecture + this SDD marked implemented

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-09-23 | approved | User: do all + record SDD |
| 2026-09-23 | implementing | |
| 2026-09-23 | implemented | Hardening shipped |
