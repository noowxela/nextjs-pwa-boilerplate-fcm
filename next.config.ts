import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const githubPages = process.env.GITHUB_PAGES === 'true'
const pagesBase = '/nextjs-pwa-boilerplate-fcm'

const nextConfig: NextConfig = {
  // Nested under Documents/github; pin Turbopack root to this app
  turbopack: {
    root: projectRoot,
    ...(githubPages
      ? {
          resolveAlias: {
            '@/app/push-panel': './app/push-panel-pages.tsx',
          },
        }
      : {}),
  },
  // Avoid auto-writing AGENTS.md / CLAUDE.md into this study boilerplate
  agentRules: false,
  ...(githubPages
    ? {
        output: 'export',
        basePath: pagesBase,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'X-Content-Type-Options',
                  value: 'nosniff',
                },
                {
                  key: 'X-Frame-Options',
                  value: 'DENY',
                },
                {
                  key: 'Referrer-Policy',
                  value: 'strict-origin-when-cross-origin',
                },
              ],
            },
            {
              source: '/firebase-messaging-sw.js',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/javascript; charset=utf-8',
                },
                {
                  key: 'Cache-Control',
                  value: 'no-cache, no-store, must-revalidate',
                },
                {
                  key: 'Service-Worker-Allowed',
                  value: '/',
                },
              ],
            },
          ]
        },
      }),
}

export default nextConfig
