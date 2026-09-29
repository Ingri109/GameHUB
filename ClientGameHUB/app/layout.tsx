import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/shared/AuthProvider'
import { SWRProvider } from '@/components/shared/SWRProvider'
import { ClientShell } from '@/components/layout/ClientShell'

export const metadata: Metadata = {
  title: 'the hub — Friends Gaming Hub',
  description: 'A private gaming space for your favorite people.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020617',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-slate-950">
      <body className="antialiased">
        <SWRProvider>
        <AuthProvider>
          <ClientShell>
            {children}
          </ClientShell>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
