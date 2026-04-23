// sections/SignupSection.tsx

import { Suspense } from 'react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { SignupForm } from '@/features/auth/components/SignupForm'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface SignupSectionProps {
  section?: { _type: 'signupSection'; _key?: string }
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export async function SignupSection({ lang = 'en', translationId, translationRow }: SignupSectionProps) {
  void lang
  const tr = translationRow

  const headline            = tr?.auth_hero_headline        ?? 'CMS-driven publishing for engineering teams.'
  const badge               = tr?.auth_hero_badge           ?? null
  const footerNote          = tr?.auth_hero_footer_note     ?? 'Powered by Supabase Auth'
  const formSubheading      = tr?.auth_heading              ?? 'Create your account'
  const submitLabel         = tr?.auth_submit_label         ?? 'Create account'
  const namePlaceholder     = tr?.auth_name_placeholder     ?? 'Your full name'
  const emailPlaceholder    = tr?.auth_email_placeholder    ?? 'you@example.com'
  const passwordPlaceholder = tr?.auth_password_placeholder ?? 'Min 8 characters'
  const footerText          = tr?.auth_footer_text          ?? 'Already have an account?'
  const footerLinkLabel     = tr?.auth_footer_link_label    ?? 'Sign in'
  const footerLinkHref      = tr?.auth_footer_link_href     ?? '/login'
  const googleLabel         = tr?.auth_google_label         ?? 'Continue with Google'

  return (
    <AuthShell
      mode="signup"
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
        <SignupForm
          subheading={formSubheading}
          submitLabel={submitLabel}
          namePlaceholder={namePlaceholder}
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