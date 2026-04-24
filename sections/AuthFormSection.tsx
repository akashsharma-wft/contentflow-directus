// sections/AuthFormSection.tsx
//
// RIGHT panel for auth pages — rendered for the `authSection` schema type.
// Reads all copy from translationRow (field-based) with fallback to section config.
// data-directus is applied on the mobile heading rendered here.
// LoginForm / SignupForm receive the resolved strings as props (no TS changes needed).

import { Suspense } from 'react'
import type { AuthSection as AuthSectionType } from '@/types/cms'
import { LoginForm }  from '@/features/auth/components/LoginForm'
import { SignupForm } from '@/features/auth/components/SignupForm'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr, pageAttrs } from '@/lib/directus/section-binding'

interface Props {
  section: AuthSectionType
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function AuthFormSection({ section, translationId, translationRow }: Props) {
  if (!section) return null

  const tr = translationRow
  const mode = section.mode ?? 'login'

  // All copy: translationRow > section config > hardcoded default
  const heading             = tr?.auth_heading             ?? section.heading
  const googleLabel         = tr?.auth_google_label        ?? section.googleLabel        ?? 'Continue with Google'
  const dividerLabel        = tr?.auth_divider_label       ?? section.dividerLabel       ?? 'or'
  const nameLabel           = tr?.auth_name_label          ?? section.nameLabel          ?? 'Name'
  const namePlaceholder     = tr?.auth_name_placeholder    ?? section.namePlaceholder    ?? 'Your full name'
  const emailLabel          = tr?.auth_email_label         ?? section.emailLabel         ?? 'Email'
  const emailPlaceholder    = tr?.auth_email_placeholder   ?? section.emailPlaceholder   ?? 'you@example.com'
  const passwordLabel       = tr?.auth_password_label      ?? section.passwordLabel      ?? 'Password'
  const passwordPlaceholder = tr?.auth_password_placeholder ?? section.passwordPlaceholder ?? (mode === 'login' ? 'Your password' : 'Min 8 characters')
  const submitLabel         = tr?.auth_submit_label        ?? section.submitLabel        ?? (mode === 'login' ? 'Sign in' : 'Create account')
  const footerText          = tr?.auth_footer_text         ?? section.footerText         ?? (mode === 'login' ? "Don't have an account?" : 'Already have an account?')
  const footerLinkLabel     = tr?.auth_footer_link_label   ?? section.footerLinkLabel    ?? (mode === 'login' ? 'Request access' : 'Sign in')
  const footerLinkHref      = tr?.auth_footer_link_href    ?? section.footerLinkHref     ?? (mode === 'login' ? '/signup' : '/login')
  const showGoogleOAuth     = section.showGoogleOAuth    ?? true
  const showEmailPassword   = section.showEmailPassword  ?? true

  return (
    <div className="flex-1 flex flex-col min-h-screen">

      {/* ── Mobile-only top bar ─────────────────────────────────────────────── */}
      <div className="flex lg:hidden items-center gap-2.5 px-5 pt-5 pb-2">
        <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 9h9m0 0-3-3m3 3-3 3M12 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-white font-semibold text-base tracking-tight">ContentFlow</span>
      </div>

      {/* ── Mobile-only heading ─────────────────────────────────────────────── */}
      {heading && (
        <div className="lg:hidden px-5 pt-4 pb-6">
          <h1
            data-directus={pageAttr(translationId, 'auth_heading')}
            className="text-white text-3xl font-bold leading-tight tracking-tight"
          >
            {heading}
          </h1>
        </div>
      )}

      {/* ── Desktop spacer ───────────────────────────────────────────────────── */}
      <div className="hidden lg:block flex-1" />

      {/* ── Form card ─────────────────────────────────────────────────────────── */}
      <div
        className="w-full lg:max-w-md lg:mx-auto px-4 lg:px-0"
        data-directus={pageAttrs(translationId, 'auth_footer_link_label', 'auth_footer_link_href')}
      >
        <Suspense
          fallback={
            <div className="bg-[#13141c] border border-white/8 rounded-2xl p-8 animate-pulse h-80" />
          }
        >
          {mode === 'signup' ? (
            <SignupForm
              subheading={heading}
              googleLabel={googleLabel}
              dividerLabel={dividerLabel}
              nameLabel={nameLabel}
              namePlaceholder={namePlaceholder}
              emailLabel={emailLabel}
              emailPlaceholder={emailPlaceholder}
              passwordLabel={passwordLabel}
              passwordPlaceholder={passwordPlaceholder}
              submitLabel={submitLabel}
              footerText={footerText}
              footerLinkLabel={footerLinkLabel}
              footerLinkHref={footerLinkHref}
              showGoogleOAuth={showGoogleOAuth}
              showEmailPassword={showEmailPassword}
            />
          ) : (
            <LoginForm
              subheading={heading}
              googleLabel={googleLabel}
              dividerLabel={dividerLabel}
              emailLabel={emailLabel}
              emailPlaceholder={emailPlaceholder}
              passwordLabel={passwordLabel}
              passwordPlaceholder={passwordPlaceholder}
              submitLabel={submitLabel}
              footerText={footerText}
              footerLinkLabel={footerLinkLabel}
              footerLinkHref={footerLinkHref}
              showGoogleOAuth={showGoogleOAuth}
              showEmailPassword={showEmailPassword}
            />
          )}
        </Suspense>
      </div>

      {/* ── Desktop spacer ────────────────────────────────────────────────────── */}
      <div className="hidden lg:block flex-1" />
    </div>
  )
}