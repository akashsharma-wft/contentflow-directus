import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ALWAYS_PUBLIC = ['/api', '/auth']
const AUTH_PAGE_SLUGS = ['login', 'signup']
const ALWAYS_AUTH = ['posts', 'analytics', 'settings', 'billing', 'admin']
const LANGS = ['hi', 'kn', 'en']

function parsePath(pathname: string): { lang: string; slug: string } {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) {
    return { lang: 'en', slug: 'home' }
  }

  if (LANGS.includes(parts[0])) {
    return {
      lang: parts[0],
      slug: parts[1] ?? 'home',
    }
  }

  return { lang: 'en', slug: parts[0] }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (ALWAYS_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const { slug } = parsePath(pathname)
  const topSlug = slug.split('/')[0]

  if (AUTH_PAGE_SLUGS.includes(topSlug)) {
    return updateSession(request)
  }

  if (ALWAYS_AUTH.includes(topSlug)) {
    return updateSession(request)
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}