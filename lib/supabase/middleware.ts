// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Slugs that logged-in users should be redirected away from (login / signup),
// regardless of language prefix — matches /login, /signup, /hi/login, /kn/signup, etc.
const AUTH_PAGE_SLUGS = new Set(['login', 'signup'])
const SUPPORTED_LANGS = new Set(['en', 'hi', 'kn'])

/** Returns true when the pathname is a login or signup page in any language. */
function isAuthPagePath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean)
  // /login or /signup
  if (parts.length === 1) return AUTH_PAGE_SLUGS.has(parts[0])
  // /hi/login, /kn/signup, /en/login, etc.
  if (parts.length === 2 && SUPPORTED_LANGS.has(parts[0])) return AUTH_PAGE_SLUGS.has(parts[1])
  return false
}

// Routes that require a logged-in session
// /studio is included — unauthenticated users get redirected to login;
// the admin/non-admin fork is handled in the studio page component itself.
const PROTECTED_PATHS = ['/posts', '/analytics', '/settings', '/billing', '/admin', '/studio']

// Routes that require admin role
const ADMIN_PATHS = ['/admin']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Logged-in user visiting any login/signup page (any language) → redirect home
  if (user && isAuthPagePath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Protected routes — redirect to login if no session
  if (!user && PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes — check role (only if user is logged in, fetching profile)
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