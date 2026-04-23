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
  const isVisualEditing = searchParams.get('visual-editing') === 'true'
  const previewToken    = searchParams.get('preview_token') ?? ''
  const validSecret     = process.env.DIRECTUS_PREVIEW_SECRET ?? ''

  // A request is a valid Directus preview if:
  //  - ?visual-editing=true is present AND
  //  - ?preview_token matches DIRECTUS_PREVIEW_SECRET (set in Vercel env)
  // This lets the iframe bypass auth without relying on cross-origin cookies.
  const isPreview =
    isVisualEditing &&
    validSecret.length > 0 &&
    previewToken === validSecret

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

  // In preview mode: skip all auth redirects so the iframe can render
  // protected pages without being logged in.
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