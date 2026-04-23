// sections/AuthHeroSection.tsx
//
// LEFT branding panel for login / signup pages.
// Rendered as a sticky, full-height column on desktop (lg+).
// Hidden on mobile — the AuthFormSection handles the mobile experience.
//
// With the auth layout wrapper being `min-h-screen bg-[#0d0e14] lg:flex lg:flex-wrap`,
// this section occupies the left 45 % on desktop and is invisible on mobile.
// AuthFormSection (right panel) takes flex-1 alongside it.

import {
  Zap, LayoutGrid, GitBranch, Globe, Eye,
  type LucideIcon,
} from 'lucide-react'
import type { AuthHeroSection as AuthHeroSectionType } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'

// Map CMS icon field values → Lucide components.
// Only icons actually used by auth hero features need to be here.
const ICON_MAP: Record<string, LucideIcon> = {
  Zap, LayoutGrid, GitBranch, Globe, Eye,
}

interface Props {
  section: AuthHeroSectionType
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function AuthHeroSection({ section }: Props) {
  if (!section) return null

  const {
    headline  = 'CMS-driven publishing for engineering teams.',
    badge,
    features  = [],
    footerNote = 'Powered by Supabase Auth',
  } = section

  return (
    <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 border-r border-white/5 sticky top-0 h-screen bg-[#0d0e14]">

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
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

      {/* ── Hero content ──────────────────────────────────────────────────── */}
      <div className="space-y-10">
        {badge && (
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            {badge}
          </span>
        )}

        <h1 className="text-white text-5xl font-bold leading-tight tracking-tight">
          {headline}
        </h1>

        {features.length > 0 && (
          <ul className="space-y-4">
            {features.map((f, i) => {
              const IconComp = f.icon ? ICON_MAP[f.icon] : null
              return (
                <li key={f._key ?? i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {IconComp
                      ? <IconComp size={16} className="text-indigo-400" />
                      : <span className="text-white/40 text-sm">✦</span>
                    }
                  </div>
                  <span className="text-white/55 text-sm font-medium">{f.text}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-white/25 text-xs uppercase tracking-widest">
          {footerNote}
        </span>
      </div>
    </div>
  )
}
