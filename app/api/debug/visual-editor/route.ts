/**
 * GET /api/debug/visual-editor
 *
 * Diagnostic endpoint — call this from inside the Directus Visual Editor
 * iframe to see exactly what headers and cookies the server receives.
 * Open DevTools → Console and run:
 *   fetch('/api/debug/visual-editor').then(r=>r.json()).then(console.log)
 *
 * Delete this route once the visual editor integration is confirmed working.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const relevantHeaders: Record<string, string> = {}
  for (const key of [
    'sec-fetch-dest',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-user',
    'referer',
    'origin',
    'user-agent',
  ]) {
    const v = request.headers.get(key)
    if (v) relevantHeaders[key] = v
  }

  const cookies: Record<string, string> = {}
  for (const cookie of request.cookies.getAll()) {
    const v = cookie.value
    cookies[cookie.name] = v.slice(0, 40) + (v.length > 40 ? '…' : '')
  }

  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    isPreview:
      request.nextUrl.searchParams.get('visual-editing') === 'true' ||
      request.cookies.get('ve_session')?.value === '1',
    ve_session: request.cookies.get('ve_session')?.value ?? null,
    headers: relevantHeaders,
    cookies,
  })
}
