# SDD: Bump all packages to latest

- **Repo:** `study/next-playground/a_3nextjs-pwa-boilerplate`
- **Status:** `implemented`
- **Date:** 2026-09-23
- **Related:** [000-architecture.md](./000-architecture.md), [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

## 1. Context / current architecture

Was Next 10 Pages + MUI v4 + Firebase FCM + `next-pwa`. Replaced with current Next App Router and the official PWA guide (manifest + Web Push VAPID + custom service worker). Old sources under `legacy/`.

## 2. Problem and non-goals

**Problem:** Dependencies years behind; need latest stack and a current PWA path.

**Non-goals:**

- Porting Twilio / SendGrid / Firebase Auth Google login in this pass
- Offline caching (optional Serwist later per guide §Extending)
- Production subscription DB (in-memory store as in the guide)

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| A. Full major vs safe? | **Full major** |
| B. Router? | **App Router** |
| C. PWA approach? | **Official Next.js PWA guide** (not Serwist / not next-pwa) |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. Latest `next`, `react`, `react-dom`, `typescript`, `web-push`
2. App Router: `app/manifest.ts`, `app/page.tsx`, `app/actions.ts`, `lib/service-worker.js`
3. Security headers from the guide in `next.config.ts`
4. VAPID keys in `.env.local`; fix bad `NODE_ENV=production` in `.env`
5. Archive old Pages/MUI/Firebase code under `legacy/`
6. Verify with `next dev` (HTTPS for push: `next dev --experimental-https`)

**Pros:** Matches current docs; Node 20/22 works; clear study path.  
**Cons:** Legacy auth/FCM features not live until a later SDD.

**Rejected:** Serwist-first (user asked for official guide); keep Pages + next-pwa.

## 5. Acceptance criteria and verification

- [x] Latest Next App Router project installs on Node 20+
- [x] Homepage 200 with Push + Install UI
- [x] `app/manifest` served
- [x] Service worker file present and registered path matches guide
- [x] Architecture doc updated

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-09-23 | draft | A/B pending |
| 2026-09-23 | approved | App Router + official Next.js PWA guide |
| 2026-09-23 | implementing | Rewrite in progress |
| 2026-09-23 | implemented | App Router PWA + latest deps verified |
