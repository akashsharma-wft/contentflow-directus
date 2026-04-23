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

  const searchParams = request.nextUrl.searchParams

  // Any request with ?visual-editing=true is a Directus preview iframe request.
  // We skip auth redirects so protected pages can render in the iframe.
  // The page content is read-only in the iframe — Directus handles auth for editing
  // via postMessage, not via your app's session cookie.
  const isPreview = searchParams.get('visual-editing') === 'true'

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
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // In preview mode: skip ALL auth redirects.
  // The page renders as guest — that's fine, we just need to SEE the page.
  // Visual editing (clicking fields to edit) works via postMessage to Directus,
  // which has its own auth. Your app's session is irrelevant for editing.
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

  // Admin check still runs even in preview (if user IS logged in, still enforce admin)
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