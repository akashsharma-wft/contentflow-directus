// app/layout.tsx
//
// Root layout — bare shell. NO global Navbar or Footer.
// Each page is responsible for its own chrome based on page.layout from the CMS.

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { VisualEditingBridge } from '@/components/directus/VisualEditingBridge'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ContentFlow — Engineering CMS',
    template: '%s — ContentFlow',
  },
  description: 'CMS-driven publishing platform for engineering teams.',
  keywords: ['CMS', 'content management', 'engineering', 'API-first'],
  authors: [{ name: 'Weframetech' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    title: 'ContentFlow — Engineering CMS',
    description: 'CMS-driven publishing platform for engineering teams.',
    siteName: 'ContentFlow',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Suspense fallback={null}>
            <VisualEditingBridge />
          </Suspense>
        </Providers>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}