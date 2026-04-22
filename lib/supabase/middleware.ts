// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_PAGE_SLUGS = new Set(['login', 'signup'])
const SUPPORTED_LANGS = new Set(['en', 'hi', 'kn'])

function isAuthPagePath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 1) return AUTH_PAGE_SLUGS.has(parts[0])
  if (parts.length === 2 && SUPPORTED_LANGS.has(parts[0])) return AUTH_PAGE_SLUGS.has(parts[1])
  return false
}

const PROTECTED_PATHS = ['/posts', '/analytics', '/settings', '/billing', '/admin']
const ADMIN_PATHS = ['/admin', '/analytics']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // When inside Directus preview iframe, cookies must be SameSite=None;Secure
  // so the browser sends them in the cross-origin iframe context.
  const isPreview = request.nextUrl.searchParams.get('visual-editing') === 'true'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = isPreview
              ? { ...options, sameSite: 'none' as const, secure: true }
              : options
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Don't redirect to login when in visual editing preview — let the page render
  // as guest rather than breaking the iframe with a redirect loop.
  if (!isPreview) {
    if (user && isAuthPagePath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (!user && PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (user && ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}