import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// These paths are ALWAYS public — no auth check needed
// NOTE: /login and /signup are intentionally absent — they go through updateSession
// so that authenticated users get redirected away (handled in lib/supabase/middleware.ts)
const ALWAYS_PUBLIC = ['/api/', '/auth/']
// Auth pages: pass through updateSession so logged-in users get redirected away
const AUTH_PAGE_SLUGS = ['login', 'signup']
// App pages that always require auth (fast-path)
// 'studio' is kept so unauthenticated users are redirected to login
const ALWAYS_AUTH = ['posts', 'analytics', 'settings', 'billing', 'admin', 'studio']
const ALWAYS_ADMIN = ['admin', 'analytics']

const LANGS = ['hi', 'kn', 'en']

function parsePath(pathname: string): { lang: string; slug: string } {
  const langMatch = LANGS.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)
  if (langMatch) {
    const rest = pathname.slice(`/${langMatch}`.length + 1) || 'home'
    return { lang: langMatch, slug: rest }
  }
  const slug = pathname.slice(1) || 'home'
  return { lang: 'en', slug }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always skip static/internal
  if (ALWAYS_PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const { slug } = parsePath(pathname)
  const topSlug = slug.split('/')[0]

  // Auth pages: run updateSession so authenticated users are redirected away
  if (AUTH_PAGE_SLUGS.includes(topSlug)) {
    return await updateSession(request)
  }

  // Fast-path: app pages always require auth
  if (ALWAYS_AUTH.includes(topSlug)) {
    const response = await updateSession(request)
    // If updateSession redirected (no session), it returns a redirect — return it
    return response
  }

  // For all other paths (home, public pages, posts/[slug]), just refresh session
  // The page itself checks access via Directus and redirects if needed
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
