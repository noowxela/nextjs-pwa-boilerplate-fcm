import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js PWA + FCM',
  description: 'Progressive Web App with Firebase Cloud Messaging (study twin of VAPID push)',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
