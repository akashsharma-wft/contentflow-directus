import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'signup' | 'recovery' | 'email' | null
  const next       = searchParams.get('next') ?? '/'
  // ve=1 means we're completing auth for the Directus Visual Editor iframe.
  // Session cookies must be SameSite=None;Secure so they travel with
  // cross-site iframe requests (otherwise the middleware never sees the session).
  const isVisualEditor = searchParams.get('ve') === '1'

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, isVisualEditor
                ? { ...options, sameSite: 'none', secure: true }
                : options
              )
            )
          } catch {}
        },
      },
    }
  )

  // Flow 1 — OAuth (Google) or magic link: exchange the code for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Flow 2 — Email verification: verify the OTP token hash
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If both fail, redirect to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}