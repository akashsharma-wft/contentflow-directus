/**
 * GET /api/directus-preview/visual-editor
 *
 * Entry point for the Directus full-page Visual Editor.
 * Configure this as the Visual Editor URL in Directus admin:
 *   Settings → Visual Editor → URL:
 *   https://contentflow-directus--akash-sharma-weframetech.vercel.app/api/directus-preview/visual-editor
 *
 * Flow:
 *  1. This route generates a magic link for PREVIEW_USER_EMAIL
 *  2. Magic link → Supabase auth → /auth/callback?ve=1&next=/?visual-editing=true
 *  3. Callback sets session cookies with SameSite=None;Secure so they persist
 *     across cross-site iframe navigations
 *  4. Home page loads with a real authenticated session in the iframe
 *  5. Protected pages (/posts, /settings, etc.) render with real user data
 */
import { NextResponse } from 'next/server'
import { generatePreviewMagicLink } from '@/lib/directus/previewAuth'

export async function GET() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '')

  // The callback will set SameSite=None cookies (for iframe persistence)
  // then redirect to the home page with ?visual-editing=true active.
  const callbackTarget = `${siteUrl}/auth/callback?ve=1&next=${encodeURIComponent('/?visual-editing=true')}`

  const dest = (await generatePreviewMagicLink(callbackTarget)) ?? `${siteUrl}/?visual-editing=true`
  return NextResponse.redirect(dest)
}
