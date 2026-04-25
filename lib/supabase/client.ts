import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  // When running inside the Directus Visual Editor iframe the parent origin is
  // contentflow.directus.app (cross-site). Supabase's default SameSite=Lax
  // cookies are not sent on cross-site iframe navigations, so the server
  // middleware never sees the session after login. SameSite=None;Secure fixes
  // this by allowing the cookie to travel in all cross-site contexts.
  const inIframe = typeof window !== 'undefined' && window !== window.top

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    inIframe ? { cookieOptions: { sameSite: 'None', secure: true } } : {}
  )
}