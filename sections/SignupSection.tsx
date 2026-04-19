// sections/SignupSection.tsx
//
// Same pattern as LoginSection — fetches authConfig, picks correct language variant.
// Called by SectionRenderer when it encounters a 'signupSection' block.

import { Suspense } from 'react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { SignupForm } from '@/features/auth/components/SignupForm'

type Lang = 'en' | 'hi' | 'kn'

interface LangField { en?: string; hi?: string; kn?: string }
interface AuthFeature { _key?: string; en: string; hi: string; kn: string; icon?: string }

interface AuthConfig {
  showGoogleOAuth?: boolean
  showEmailPassword?: boolean
  signupHeading?: LangField
  signupSubheading?: LangField
  signupSubmitLabel?: LangField
  signupNamePlaceholder?: LangField
  signupEmailPlaceholder?: LangField
  signupPasswordPlaceholder?: LangField
  signupFooterText?: LangField
  signupFooterLinkLabel?: LangField
  signupFooterLinkHref?: string
  signupGoogleLabel?: LangField
  leftPanelHeadline?: LangField
  leftPanelBadge?: LangField
  leftPanelFeatures?: AuthFeature[]
  leftPanelFooterNote?: LangField
}

function t(field: LangField | undefined, lang: Lang): string {
  if (!field) return ''
  return field[lang] ?? field.en ?? ''
}

interface SignupSectionProps {
  section?: {
    _type: 'signupSection'
    _key?: string
  }
  lang?: string
}

export async function SignupSection({ lang = 'en' }: SignupSectionProps) {
  void lang

  const copy = {
    headline:            'CMS-driven publishing for engineering teams.',
    subheadline:         'Create your account',
    badge:               null as string | null,
    formSubheading:      'Join the ContentFlow workspace',
    submitLabel:         'Create account',
    namePlaceholder:     'Your full name',
    emailPlaceholder:    'you@example.com',
    passwordPlaceholder: 'Min 8 characters',
    footerText:          'Already have an account?',
    footerLinkLabel:     'Sign in',
    footerLinkHref:      '/login',
    googleLabel:         'Continue with Google',
    footerNote:          'Powered by Supabase Auth',
    showGoogleOAuth:     true,
    showEmailPassword:   true,
    features:            [] as { text: string; icon?: string }[],
  }

  return (
    <AuthShell
      mode="signup"
      headline={copy.headline}
      subheadline={copy.subheadline}
      badge={copy.badge}
      features={copy.features}
      footerNote={copy.footerNote}
    >
      <Suspense
        fallback={
          <div className="bg-[#13141c] border border-white/8 rounded-2xl p-8 animate-pulse h-80" />
        }
      >
        <SignupForm
          subheading={copy.formSubheading}
          submitLabel={copy.submitLabel}
          namePlaceholder={copy.namePlaceholder}
          emailPlaceholder={copy.emailPlaceholder}
          passwordPlaceholder={copy.passwordPlaceholder}
          footerText={copy.footerText}
          footerLinkLabel={copy.footerLinkLabel}
          footerLinkHref={copy.footerLinkHref}
          googleLabel={copy.googleLabel}
          showGoogleOAuth={copy.showGoogleOAuth}
          showEmailPassword={copy.showEmailPassword}
        />
      </Suspense>
    </AuthShell>
  )
}