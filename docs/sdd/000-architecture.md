# Architecture: nextjs-pwa-boilerplate (FCM fork)

- **Repo:** `o000o_active/a_3nextjs-pwa-boilerplate_fcm`
- **Status:** living doc
- **Date:** 2026-09-23

## Intent

Study twin of `a_3nextjs-pwa-boilerplate` (Web Push VAPID). This fork uses **Firebase Cloud Messaging** for web push instead of direct `web-push`.

## Stack (target)

- Next.js App Router (`^16`), React 19, TypeScript 5.9, Node `>=20`
- Firebase JS SDK (client messaging) + Firebase Admin (server send)
- PWA: `app/manifest.ts` + install UX
- Service worker: `public/firebase-messaging-sw.js` (FCM background)
- Token store: `data/fcm-tokens.json` (gitignored)

## Data flow

1. Client requests notification permission
2. `getToken(messaging, { vapidKey })` → FCM registration token
3. Server Action saves token to `data/fcm-tokens.json`
4. `sendNotification` uses Admin `messaging().send(...)` to each token
5. Background: FCM SW shows notification; foreground: `onMessage` updates UI

## Relation to VAPID sibling

| | Sibling (VAPID) | This fork (FCM) |
| --- | --- | --- |
| Send | `web-push` + PushSubscription | Firebase Admin + FCM token |
| SW | `lib/service-worker.js` | `public/firebase-messaging-sw.js` |
| Cloud | None | Firebase project required |

GitHub Pages (`GITHUB_PAGES=true`) static-exports this UI to `https://noowxela.github.io/nextjs-pwa-boilerplate-fcm/`. Subscribe and send stay on local `next dev`.
