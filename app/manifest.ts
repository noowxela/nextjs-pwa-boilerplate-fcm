import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const pagesBase =
  process.env.GITHUB_PAGES === 'true' ? '/nextjs-pwa-boilerplate-fcm' : ''

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next.js PWA + FCM',
    short_name: 'PWA-FCM',
    description: 'Progressive Web App with Firebase Cloud Messaging',
    start_url: `${pagesBase}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: `${pagesBase}/icon-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${pagesBase}/icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
