# SDD: Repo cleanup

- **Repo:** `o000o_active/a_3nextjs-pwa-boilerplate_fcm`
- **Status:** `implemented`
- **Date:** 2026-09-23
- **Related:** [000-architecture.md](./000-architecture.md), [001-fcm-push.md](./001-fcm-push.md)

## 1. Context / current architecture

The running app is the App Router FCM PWA: `app/`, `lib/firebase-client.ts`, `lib/firebase-admin.ts`, `lib/fcm-tokens.ts`, and `public/firebase-messaging-sw.js`.

`main` still has the cloned boilerplate history. The Pages/auth tree is already deleted on disk but still recorded in that history. Credit for the starting repo lives in the README, not here.

`.env`, `.env.local`, `certificates/`, `data/`, `node_modules/`, and `.next/` stay local and gitignored.

## 2. Problem and non-goals

**Problem:** The folder and git history still look like the cloned boilerplate. This app should match the cleanup already done on the VAPID sibling.

**Non-goals:**

- Changing FCM subscribe, send, or install behavior
- Deleting `public/firebase-messaging-sw.js` or the Firebase libs
- Deleting local secrets, certs, `node_modules`, or `.next`
- Creating a GitHub repo or pushing
- Force-pushing to the previous origin

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Same cleanup as the VAPID sibling? | Yes. Keep FCM source. One root commit. Do not push. |
| Where does the starting-repo credit go? | README only. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. Replace the long boilerplate `.gitignore` with a short Next.js ignore list (`.DS_Store`, env files, `data/`, `certificates/`, `.next/`).
2. Delete `.DS_Store`.
3. Replace `LICENSE` with MIT copyright 2026 Alex Woon Jun Rong.
4. Add the starting-repo credit to the README.
5. Point `000-architecture.md` at `o000o_active/a_3nextjs-pwa-boilerplate_fcm`.
6. Replace local history with one root commit on `main` and remove the previous `origin`. Do not push.

**Pros:**

- The tree matches the FCM app that actually runs.
- A later push cannot hit the previous remote by accident.

**Cons / risks:**

- Local boilerplate history is dropped. The previous remote on GitHub is left as it is.
- `public/firebase-messaging-sw.js` keeps the public Firebase web config, which the service worker needs.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Commit on top of the boilerplate history | A new GitHub repo would still show that history |
| Delete the Firebase service worker | This app sends push through FCM |

## 5. Acceptance criteria and verification

- [x] `.DS_Store`, `.env`, `data/`, and `certificates/` are ignored
- [x] FCM source files still present
- [x] `main` has one commit
- [x] Previous `origin` is removed
- [x] `npm run build` succeeds
- [x] Nothing pushed

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-09-23 | approved | Same cleanup as the VAPID sibling; do not push |
| 2026-09-23 | implemented | One root commit; previous origin removed; build passed |
