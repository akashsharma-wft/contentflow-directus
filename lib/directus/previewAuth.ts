import { createClient } from '@supabase/supabase-js'

/**
 * Generates a Supabase magic-link for the PREVIEW_USER_EMAIL account.
 * When the browser follows the link, Supabase authenticates the user and
 * redirects to `redirectTo`, so the preview iframe gets a real session.
 *
 * Returns null if PREVIEW_USER_EMAIL is not set — callers should fall back
 * to a plain redirect.
 */
export async function generatePreviewMagicLink(redirectTo: string): Promise<string | null> {
  const email = process.env.PREVIEW_USER_EMAIL
  if (!email) return null

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.action_link) return null
  return data.properties.action_link
}
