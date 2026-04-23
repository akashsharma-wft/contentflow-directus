// sections/LoginSection.tsx

import { Suspense } from 'react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { LoginForm } from '@/features/auth/components/LoginForm'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface LoginSectionProps {
  section?: { _type: 'loginSection'; _key?: string }
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export async function LoginSection({ lang = 'en', translationId, translationRow }: LoginSectionProps) {
  const tr = translationRow

  const headline            = tr?.auth_hero_headline    ?? 'CMS-driven publishing for engineering teams.'
  const badge               = tr?.auth_hero_badge       ?? null
  const footerNote          = tr?.auth_hero_footer_note ?? 'Powered by Supabase Auth'
  const formSubheading      = tr?.auth_heading          ?? 'Sign in to your workspace'
  const submitLabel         = tr?.auth_submit_label     ?? 'Sign in'
  const emailPlaceholder    = tr?.auth_email_placeholder    ?? 'you@example.com'
  const passwordPlaceholder = tr?.auth_password_placeholder ?? 'Your password'
  const footerText          = tr?.auth_footer_text      ?? "Don't have an account?"
  const footerLinkLabel     = tr?.auth_footer_link_label ?? 'Request access'
  const footerLinkHref      = tr?.auth_footer_link_href  ?? '/signup'
  const googleLabel         = tr?.auth_google_label     ?? 'Continue with Google'

  return (
    <AuthShell
      mode="signin"
      headline={headline}
      headlineAttr={pageAttr(translationId, 'auth_hero_headline')}
      subheadline={formSubheading}
      badge={badge}
      badgeAttr={pageAttr(translationId, 'auth_hero_badge')}
      features={[]}
      footerNote={footerNote}
      footerNoteAttr={pageAttr(translationId, 'auth_hero_footer_note')}
    >
      <Suspense fallback={<div className="bg-[#13141c] border border-white/8 rounded-2xl p-8 animate-pulse h-80" />}>
        <LoginForm
          subheading={formSubheading}
          submitLabel={submitLabel}
          emailPlaceholder={emailPlaceholder}
          passwordPlaceholder={passwordPlaceholder}
          footerText={footerText}
          footerLinkLabel={footerLinkLabel}
          footerLinkHref={footerLinkHref}
          googleLabel={googleLabel}
          showGoogleOAuth={true}
          showEmailPassword={true}
        />
      </Suspense>
    </AuthShell>
  )
}