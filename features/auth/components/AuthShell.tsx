// features/auth/components/AuthShell.tsx
//
// Layout shell for login + signup pages.
// Split layout: left panel (branding/features) + right panel (form).
//
// All text comes from props — no hardcoded English strings.
// LoginSection and SignupSection provide all display text as props.

import type { ReactNode } from 'react'

interface Feature {
  text: string
  icon?: string
}

interface AuthShellProps {
  children: ReactNode
  mode: 'signin' | 'signup'
  headline: string
  subheadline: string
  badge: string | null
  features?: Feature[]
  footerNote?: string
}

export function AuthShell({
  children,
  headline,
  subheadline,
  badge,
  features = [],
  footerNote,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#0d0e14] flex flex-col lg:flex-row">

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
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

      {/* ── Left panel — desktop only ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 border-r border-white/5">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 9h9m0 0-3-3m3 3-3 3M12 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"
                stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">ContentFlow</span>
        </div>

        {/* Hero content */}
        <div className="space-y-10">
          {/* Badge */}
          {badge && (
            <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              {badge}
            </span>
          )}

          {/* Headline */}
          <h1 className="text-white text-5xl font-bold leading-tight tracking-tight">
            {headline}
          </h1>

          {/* Feature bullets — all text from authConfig in the right language */}
          {features.length > 0 && (
            <ul className="space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {/* Lucide icon by name — just show a dot if icon is unknown */}
                    <span className="text-white/50 text-xs font-mono">
                      {feature.icon ? feature.icon.slice(0, 2) : '✦'}
                    </span>
                  </div>
                  <span className="text-white/55 text-sm font-medium">{feature.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer note — e.g. "Powered by Supabase Auth" */}
        <div className="flex items-center gap-2">
          <span className="text-white/25 text-xs uppercase tracking-widest">
            {footerNote ?? 'Powered by Supabase Auth'}
          </span>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:justify-between lg:items-center lg:px-6 lg:py-12">

        {/* Mobile hero — only on small screens */}
        <div className="lg:hidden px-5 pt-4 pb-6 space-y-3">
          {badge && (
            <span className="inline-block bg-indigo-500/20 text-indigo-400 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30">
              {badge}
            </span>
          )}
          <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">
            {headline}
          </h1>
          <p className="text-white/40 text-sm">{subheadline}</p>
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block" />

        {/* The form card — passed as children */}
        <div className="w-full lg:max-w-md px-4 lg:px-0">
          {children}
        </div>

        {/* Mobile feature bullets — below form on mobile */}
        {features.length > 0 && (
          <div className="lg:hidden px-4 pt-8 pb-4 space-y-4">
            {features.slice(0, 2).map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs">{feature.icon?.slice(0, 2) ?? '✦'}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer links */}
        <div className="flex flex-col items-center gap-3 py-8 lg:py-0">
          <div className="flex items-center gap-5">
            {/* These are legal links — kept in English as they're typically not translated */}
            {['Terms of Service', 'Privacy Policy', 'Security'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-white/20 text-[10px] uppercase tracking-widest hover:text-white/40 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-white/15 text-[10px] uppercase tracking-widest lg:hidden">
            © {new Date().getFullYear()} ContentFlow Engineering
          </p>
        </div>
      </div>
    </div>
  )
}