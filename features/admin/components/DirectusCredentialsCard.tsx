// features/admin/components/DirectusCredentialsCard.tsx
//
// Server component — reads secret env vars and passes them as props to the
// client card. This ensures DIRECTUS_ADMIN_PASSWORD never leaks into the
// browser bundle — it only exists as a rendered prop value.

import { DirectusCredentialsCardClient } from './DirectusCredentialsCardClient'

export function DirectusCredentialsCard() {
  const directusUrl   = process.env.NEXT_PUBLIC_DIRECTUS_URL  ?? ''
  const adminEmail    = process.env.DIRECTUS_ADMIN_EMAIL      ?? '(not set — add DIRECTUS_ADMIN_EMAIL to Vercel env)'
  const adminPassword = process.env.DIRECTUS_ADMIN_PASSWORD   ?? '(not set — add DIRECTUS_ADMIN_PASSWORD to Vercel env)'

  return (
    <DirectusCredentialsCardClient
      directusUrl={directusUrl}
      adminEmail={adminEmail}
      adminPassword={adminPassword}
    />
  )
}