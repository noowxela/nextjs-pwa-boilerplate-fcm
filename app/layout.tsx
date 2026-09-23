import type { Metadata } from 'next'
import './globals.css'

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
      <body>
        <div className="main">
          <div className="gradient"></div>
        </div>
        <main className="app">
            {children}
        </main>
      </body>
    </html>
  )
}
