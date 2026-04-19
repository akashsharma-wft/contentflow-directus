// sections/LoginSection.tsx
// Renders the full login page UI with hardcoded copy (CMS-independent).

import { Suspense } from 'react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { LoginForm } from '@/features/auth/components/LoginForm'

type Lang = 'en' | 'hi' | 'kn'

interface LangField {
  en?: string
  hi?: string
  kn?: string
}

interface AuthFeature {
  _key?: string
  en: string
  hi: string
  kn: string
  icon?: string
}

interface AuthConfig {
  showGoogleOAuth?: boolean
  showEmailPassword?: boolean
  loginHeading?: LangField
  loginSubheading?: LangField
  loginSubmitLabel?: LangField
  loginEmailPlaceholder?: LangField
  loginPasswordPlaceholder?: LangField
  loginFooterText?: LangField
  loginFooterLinkLabel?: LangField
  loginFooterLinkHref?: string
  loginGoogleLabel?: LangField
  leftPanelHeadline?: LangField
  leftPanelBadge?: LangField
  leftPanelFeatures?: AuthFeature[]
  leftPanelFooterNote?: LangField
}

// Pick correct language from a multi-lang field, fallback to English
function t(field: LangField | undefined, lang: Lang): string {
  if (!field) return ''
  return field[lang] ?? field.en ?? ''
}

interface LoginSectionProps {
  section?: {
    _type: 'loginSection'
    _key?: string
  }
  lang?: string
}

export async function LoginSection({ lang = 'en' }: LoginSectionProps) {
  const l = (lang as Lang) ?? 'en'
  void l

  const copy = {
    headline:            'CMS-driven publishing for engineering teams.',
    subheadline:         'Welcome back',
    badge:               null as string | null,
    formSubheading:      'Sign in to your workspace',
    submitLabel:         'Sign in',
    emailPlaceholder:    'you@example.com',
    passwordPlaceholder: 'Your password',
    footerText:          "Don't have an account?",
    footerLinkLabel:     'Request access',
    footerLinkHref:      '/signup',
    googleLabel:         'Continue with Google',
    footerNote:          'Powered by Supabase Auth',
    showGoogleOAuth:     true,
    showEmailPassword:   true,
    features:            [] as { text: string; icon?: string }[],
  }

  return (
    <AuthShell
      mode="signin"
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
        <LoginForm
          subheading={copy.formSubheading}
          submitLabel={copy.submitLabel}
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