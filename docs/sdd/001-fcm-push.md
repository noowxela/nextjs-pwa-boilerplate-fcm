# SDD: Implement FCM web push

- **Repo:** `study/next-playground/a_3nextjs-pwa-boilerplate_fcm`
- **Status:** `implemented`
- **Date:** 2026-09-23
- **Related:** [000-architecture.md](./000-architecture.md), sibling VAPID app `a_3nextjs-pwa-boilerplate`

## 1. Context

Folder is the FCM study twin of the VAPID PWA app. Client uses Firebase JS Messaging; server uses Firebase Admin + `data/fcm-tokens.json`. Admin private key fields may still be placeholders until set in Firebase Console.

## 2. Problem and non-goals

**Problem:** User wants the **FCM method** in this repo for side-by-side learning with the VAPID sibling.

**Non-goals:** Google Sign-In, Twilio, SendGrid, Firestore chat, native mobile apps.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Push backend? | **FCM** (not web-push) |
| Keep App Router + manifest/install UI? | **Yes** |
| Admin credentials? | Use env; send works only after real Admin private key is set |

## 4. Approach

1. Add `package.json` with `next`, `react`, `firebase`, `firebase-admin`, TypeScript
2. Client: `lib/firebase-client.ts`, hooks for token + `onMessage`
3. `public/firebase-messaging-sw.js` with same public Firebase config (hardcoded from `NEXT_PUBLIC_*` study values)
4. Server: `lib/firebase-admin.ts` (lazy), `lib/fcm-tokens.ts`, `app/actions.ts` save/remove/send via Admin
5. Rewrite `app/page.tsx` for FCM (keep notification settings check + install prompt)
6. Normalize env to `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_FIREBASE_VAPID_KEY` + Admin vars; `.env.example` + README
7. Prefer port **3002** in scripts to run beside the VAPID app on 3000

**Pros:** Direct comparison with VAPID sibling; real FCM learning path.  
**Cons:** Needs Firebase project + Admin key for server send; SW config must stay in sync with client.

**Rejected:** Keep web-push in this folder (defeats fork purpose).

## 5. Acceptance criteria

- [x] `npm install` + `npm run dev` starts
- [x] With permission + valid web config/VAPID, client shows FCM token
- [x] Token persisted under `data/`
- [x] Send via Admin works when Admin credentials are real (otherwise clear error)
- [x] README + architecture document FCM flow
- [x] SDD marked implemented

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-09-23 | approved | User: do the fcm method in this folder |
| 2026-09-23 | implementing | |
| 2026-09-23 | implemented | package.json, FCM client/admin/SW/actions/page, env normalized, build verified |
