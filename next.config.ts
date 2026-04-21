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
    return []
  },
  // Middleware rewrites x-pathname header — this enables layout.tsx to know
  // the current route without being a client component.
  experimental: {
    // needed for server components to read request headers in layout
  },
}

export default nextConfig