// features/auth/components/AuthShell.tsx
//
// Layout shell for login + signup pages.
// All text comes from props — no hardcoded English strings.
// Attr props (headlineAttr, badgeAttr, footerNoteAttr) carry data-directus values
// so every visible text element is visual-editing-bindable.

import type { ReactNode } from 'react'

interface Feature {
  text: string
  icon?: string
}

interface AuthShellProps {
  children: ReactNode
  mode: 'signin' | 'signup'
  headlineAttr: string | null
  headline: string
  subheadline: string
  badgeAttr: string | null
  badge: string | null
  features?: Feature[]
  footerNote?: string
  footerNoteAttr?: string | null
}

export function AuthShell({
  children,
  headline,
  subheadline,
  badge,
  features = [],
  footerNote,
  headlineAttr,
  badgeAttr,
  footerNoteAttr,
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
            <span
              {...(badgeAttr ? { 'data-directus': badgeAttr } : {})}
              className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
            >
              {badge}
            </span>
          )}

          {/* Headline */}
          <h1
            {...(headlineAttr ? { 'data-directus': headlineAttr } : {})}
            className="text-white text-5xl font-bold leading-tight tracking-tight"
          >
            {headline}
          </h1>

          {/* Subheadline — visible on left panel for context */}
          <p className="text-white/50 text-base leading-relaxed">
            {subheadline}
          </p>

          {/* Feature bullets */}
          {features.length > 0 && (
            <ul className="space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
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

        {/* Footer note */}
        {footerNote && (
          <p
            {...(footerNoteAttr ? { 'data-directus': footerNoteAttr } : {})}
            className="text-white/20 text-xs font-mono"
          >
            {footerNote}
          </p>
        )}
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 lg:px-16">
        {children}
      </div>
    </div>
  )
}