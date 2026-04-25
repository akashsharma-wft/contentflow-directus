// features/auth/components/LoginForm.tsx
// 'use client' — runs in the browser (handles form state, Supabase calls)
//
// Receives all display text as props from LoginSection.
// No hardcoded English strings anywhere in this component.
// The Supabase auth calls themselves don't need translation.
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { pageAttr, pageAttrs } from '@/lib/directus/section-binding'

interface LoginFormProps {
  translationId?: number
  // All strings from CMS in the correct language
  subheading?: string
  submitLabel?: string
  emailLabel?: string
  emailPlaceholder?: string
  passwordLabel?: string
  passwordPlaceholder?: string
  dividerLabel?: string
  footerText?: string
  footerLinkLabel?: string
  footerLinkHref?: string
  googleLabel?: string
  showGoogleOAuth?: boolean
  showEmailPassword?: boolean
}

export function LoginForm({
  translationId,
  subheading = 'Sign in to your workspace',
  submitLabel = 'Sign in',
  emailLabel = 'Email',
  emailPlaceholder = 'you@example.com',
  passwordLabel = 'Password',
  passwordPlaceholder = 'Your password',
  dividerLabel = 'or',
  footerText = "Don't have an account?",
  footerLinkLabel = 'Request access',
  footerLinkHref = '/signup',
  googleLabel = 'Continue with Google',
  showGoogleOAuth = true,
  showEmailPassword = true,
}: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const authError   = searchParams.get('error')
  const redirectTo  = searchParams.get('redirectTo') ?? '/'

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google login failed')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="bg-[#13141c] border border-white/8 rounded-2xl p-6 lg:p-8 space-y-5">

      {/* Auth error banner — shown if redirected back with ?error= */}
      {authError && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-red-400 text-xs">
            {authError === 'auth_failed'
              ? 'Authentication failed. Please try again.'
              : 'Something went wrong. Please try again.'}
          </p>
        </div>
      )}

      {/* Icon + heading — desktop only */}
      <div className="hidden lg:flex flex-col items-center gap-3 pb-1">
        <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-center">
          <p
            data-directus={pageAttr(translationId, 'auth_heading')}
            className="text-white/35 text-sm mt-0.5"
          >
            {subheading}
          </p>
        </div>
      </div>

      {/* Google OAuth button */}
      {showGoogleOAuth && (
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          data-directus={pageAttr(translationId, 'auth_google_label')}
          className={cn(
            'w-full flex items-center justify-center gap-3 h-11 px-4',
            'bg-white/5 border border-white/10 rounded-xl',
            'text-white/80 text-sm font-medium',
            'hover:bg-white/8 hover:border-white/20 transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {/* Google G logo */}
          <svg width="17" height="17" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
          </svg>
          {/* Translated Google button label */}
          {isGoogleLoading ? '...' : googleLabel}
        </button>
      )}

      {/* OR divider — only shown when both OAuth and email/password are enabled */}
      {showGoogleOAuth && showEmailPassword && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/8" />
          </div>
          <div className="relative flex justify-center">
            <span
              data-directus={pageAttr(translationId, 'auth_divider_label')}
              className="bg-[#13141c] px-3 text-white/20 text-[11px] uppercase tracking-widest"
            >
              {dividerLabel}
            </span>
          </div>
        </div>
      )}

      {/* Email + password form */}
      {showEmailPassword && (
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label
              data-directus={pageAttrs(translationId, 'auth_email_label', 'auth_email_placeholder')}
              className="text-white/45 text-[11px] font-semibold uppercase tracking-wider"
            >
              {emailLabel}
            </Label>
            <Input
              type="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              data-directus={pageAttrs(translationId, 'auth_email_label', 'auth_email_placeholder')}
              className="bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 rounded-xl"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label
              data-directus={pageAttrs(translationId, 'auth_password_label', 'auth_password_placeholder')}
              className="text-white/45 text-[11px] font-semibold uppercase tracking-wider"
            >
              {passwordLabel}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                data-directus={pageAttrs(translationId, 'auth_password_label', 'auth_password_placeholder')}
                className="bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            data-directus={pageAttr(translationId, 'auth_submit_label')}
            className={cn(
              'w-full h-11 rounded-xl font-semibold text-sm',
              'bg-indigo-500 hover:bg-indigo-600 text-white',
              'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? '...' : submitLabel}
          </button>
        </form>
      )}

      {/* Footer */}
      <p
        data-directus={pageAttrs(translationId, 'auth_footer_text', 'auth_footer_link_label', 'auth_footer_link_href')}
        className="text-center text-white/30 text-sm"
      >
        {footerText}{' '}
        <a
          href={footerLinkHref}
          className="text-white/60 hover:text-white transition-colors font-medium"
        >
          {footerLinkLabel}
        </a>
      </p>
    </div>
  )
}