# SDD: GitHub Pages deploy

- **Repo:** `o000o_active/a_3nextjs-pwa-boilerplate_fcm`
- **Status:** `implemented`
- **Date:** 2026-09-23
- **Related:** [000-architecture.md](./000-architecture.md), VAPID sibling `004-github-pages.md`

## 1. Context / current architecture

The app is a Next.js App Router server. `app/page.tsx` is the client UI. Subscribe, unsubscribe, and send call server actions in `app/actions.ts` (Firebase Admin plus `data/fcm-tokens.json`). `next.config.ts` sets security headers and does not use `output: 'export'` unless `GITHUB_PAGES=true`.

The GitHub repo is `noowxela/nextjs-pwa-boilerplate-fcm`.

## 2. Problem and non-goals

**Problem:** Pushes to `main` should publish the frontend on GitHub Pages.

**Non-goals:**

- Running FCM subscribe or send on Pages
- Changing local `npm run dev` / `npm run build` so they stay a server app

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Same workflow as the VAPID repo? | Yes. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. When `GITHUB_PAGES=true`, `next.config.ts` uses `output: 'export'`, `basePath` `/nextjs-pwa-boilerplate-fcm`, and `trailingSlash: true`. It skips `headers()`.
2. That build aliases `@/app/push-panel` to `app/push-panel-pages.tsx`, so `app/actions.ts` is not in the static bundle. The page still shows the notification check and install prompt.
3. `.github/workflows/pages.yml` on push to `main` builds with `GITHUB_PAGES=true` and deploys `out/` with `actions/deploy-pages`.
4. Live URL: `https://noowxela.github.io/nextjs-pwa-boilerplate-fcm/`.

**Pros:**

- The UI publishes on every push to `main`.
- Local FCM testing is unchanged.

**Cons / risks:**

- The Pages site cannot deliver FCM.
- The first run needs the repo Pages setting set to GitHub Actions.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| `output: 'export'` for every build | Local `next start` would lose server actions |
| Host Firebase Admin on Pages | Pages serves files only |

## 5. Acceptance criteria and verification

- [x] `GITHUB_PAGES=true npm run build` writes `out/` and does not bundle `saveFcmToken`
- [x] `npm run build` without `GITHUB_PAGES` still produces a server build
- [ ] Push to `main` runs the Pages workflow
- [ ] `https://noowxela.github.io/nextjs-pwa-boilerplate-fcm/` shows the notification check and install prompt

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-09-23 | approved | Same workflow as the VAPID repo |
| 2026-09-23 | implemented | Workflow and static export; live URL after the Actions run |
