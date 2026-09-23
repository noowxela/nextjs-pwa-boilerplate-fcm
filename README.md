# Next.js PWA + FCM (study)

FCM twin of [`a_3nextjs-pwa-boilerplate`](../a_3nextjs-pwa-boilerplate) (Web Push VAPID). Same App Router + install UX; push goes through **Firebase Cloud Messaging** instead of `web-push`.

| | Sibling (VAPID) | This app (FCM) |
| --- | --- | --- |
| Port | 3000 | **3002** |
| Send | `web-push` + PushSubscription | Firebase Admin + FCM token |
| SW | `lib/service-worker.js` | `public/firebase-messaging-sw.js` |
| Cloud | None | Firebase project required |

Design notes: [docs/sdd/000-architecture.md](docs/sdd/000-architecture.md), [docs/sdd/001-fcm-push.md](docs/sdd/001-fcm-push.md).

## Setup

1. Copy `.env.example` → `.env` / `.env.local` (already filled for the `pwa-pushnotification` study project web config).

2. **Web config** — Firebase Console → Project settings → Your apps → Web:

   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

3. **Web Push VAPID key** — Cloud Messaging → Web Push certificates → Key pair → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

4. **Admin SDK** (required for **Send Test**): Project settings → Service accounts → Generate new private key. Set:

   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (keep `\n` escapes or paste PEM; the server normalizes `\\n`)

   Until these are real (not `place_your_value`), subscribe still works; send returns a clear error.

5. Keep `public/firebase-messaging-sw.js` `initializeApp({...})` in sync with the same public web config.

```bash
npm install
npm run dev:https   # https://localhost:3002
# or
npm run dev         # http://localhost:3002
```

Push / service workers need a secure context (HTTPS or localhost). Prefer `dev:https` when testing outside plain localhost.

## Troubleshoot: `messaging/token-subscribe-failed` (OAuth / missing credential)

This is thrown by Google’s FCM registration API during `getToken`. It is usually **project config**, not “you must sign in with Google on the page”.

1. **Enable the API** — [Google Cloud Console](https://console.cloud.google.com/) → select project `pwa-pushnotification-a5e7e` → **APIs & Services → Library** → enable:
   - **Firebase Cloud Messaging API**
   - **Firebase Installations API** (if listed)
2. **Correct VAPID key** — Firebase Console → **Project settings → Cloud Messaging → Web Push certificates** → copy the **Key pair** into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.  
   Do **not** use a key from `web-push generate-vapid-keys`, and do **not** use the legacy “Server key”.
3. **API key restrictions** — Cloud Console → **APIs & Services → Credentials** → your Browser API key → if Application restrictions are on, allow `https://localhost:3002/*` (and `http://localhost:3002/*`). If API restrictions are on, include FCM / Installations.
4. **Clear site data** for `https://localhost:3002` (Firefox: padlock → Clear cookies and site data), then hard refresh and Subscribe again.
5. Restart `npm run dev:https` after any `.env.local` change.

## Troubleshoot: `Third party auth error` / `messaging/third-party-auth-error`

Subscribe worked (token saved) but **Send Test** failed. Firebase docs: the Web Push / APNs credentials used to deliver to the browser were invalid or missing.

1. Firebase Console → **Project settings → Cloud Messaging → Web Push certificates**
   - Prefer **Generate key pair** (not a broken Import).
   - Put that **public** key in `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, restart server, **Unsubscribe → Subscribe** (new token).
2. Try **Chrome** (or Edge). Tokens from **Firefox** often get this error on send even when Subscribe succeeds (known FCM/web-push backend issue).
3. Confirm Admin service account is from the **same** project as the web app (`pwa-pushnotification-a5e7e`).

## Firefox / macOS notes

- Site permission must be `granted` (use “Notification settings check” on the page).
- **System Settings → Notifications → Firefox** → Alerts or Banners (not None).
- Unfocus Firefox — banners often do not show while it is focused.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next on port 3002 |
| `npm run dev:https` | Same with `--experimental-https` |
| `npm run build` / `start` | Production build / serve on 3002 |

## Credit

Started from [nextjs-pwa-boilerplate](https://github.com/JithinAntony4/nextjs-pwa-boilerplate) (MIT). This tree is the FCM App Router app.
