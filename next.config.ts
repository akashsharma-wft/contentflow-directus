// next.config.ts
// We add x-pathname header to every request so the root layout can
// conditionally show/hide Navbar & Footer on dashboard pages.
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ktqsazdaexebnxxqueuc.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        // Allow Directus to embed the frontend in its visual editor iframe.
        // frame-ancestors replaces the deprecated X-Frame-Options header.
        // Only the Directus origin (and self) is whitelisted.
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://contentflow.directus.app",
          },
        ],
      },
    ]
  },
  // Middleware rewrites x-pathname header — this enables layout.tsx to know
  // the current route without being a client component.
  experimental: {
    // needed for server components to read request headers in layout
  },
}

export default nextConfig