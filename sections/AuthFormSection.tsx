// sections/AuthFormSection.tsx
//
// RIGHT panel for auth pages — rendered for the `authSection` schema type.
// Contains:
//   - Mobile-only top bar  (logo)
//   - Mobile-only heading  (authSection.heading)
//   - Centered form card   (LoginForm or SignupForm, all copy from CMS config)
//
// On desktop this is a flex-1 column that sits next to AuthHeroSection.
// On mobile this is full-width (AuthHeroSection is hidden on mobile).
//
// AUTH LOGIC is NOT rewritten — LoginForm / SignupForm are reused as-is.
// Only the COPY (labels, placeholders, button text) is CMS-driven via section props.

import { Suspense } from 'react'
import type { AuthSection as AuthSectionType } from '@/types/cms'
import { LoginForm }  from '@/features/auth/components/LoginForm'
import { SignupForm } from '@/features/auth/components/SignupForm'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  section: AuthSectionType
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function AuthFormSection({ section }: Props) {
  if (!section) return null

  const {
    mode               = 'login',
    heading,
    googleLabel        = 'Continue with Google',
    dividerLabel       = 'or',
    nameLabel          = 'Name',
    namePlaceholder    = 'Your full name',
    emailLabel         = 'Email',
    emailPlaceholder   = 'you@example.com',
    passwordLabel      = 'Password',
    passwordPlaceholder = mode === 'login' ? 'Your password' : 'Min 8 characters',
    submitLabel        = mode === 'login' ? 'Sign in' : 'Create account',
    footerText         = mode === 'login' ? "Don't have an account?" : 'Already have an account?',
    footerLinkLabel    = mode === 'login' ? 'Request access' : 'Sign in',
    footerLinkHref     = mode === 'login' ? '/signup' : '/login',
    showGoogleOAuth    = true,
    showEmailPassword  = true,
  } = section

  return (
    <div className="flex-1 flex flex-col min-h-screen">

      {/* ── Mobile-only top bar ───────────────────────────────────────────── */}
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

      {/* ── Mobile-only heading ───────────────────────────────────────────── */}
      {heading && (
        <div className="lg:hidden px-5 pt-4 pb-6">
          <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">
            {heading}
          </h1>
        </div>
      )}

      {/* ── Desktop spacer (pushes form to vertical center) ──────────────── */}
      <div className="hidden lg:block flex-1" />

      {/* ── Form card ─────────────────────────────────────────────────────── */}
      <div className="w-full lg:max-w-md lg:mx-auto px-4 lg:px-0">
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

      {/* ── Desktop spacer ────────────────────────────────────────────────── */}
      <div className="hidden lg:block flex-1" />
    </div>
  )
}
