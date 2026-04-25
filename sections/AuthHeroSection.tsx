// sections/AuthHeroSection.tsx
//
// LEFT branding panel for login / signup pages.
// Now reads copy from translationRow with data-directus on every text element.

import {
  Zap, LayoutGrid, GitBranch, Globe, Eye,
  type LucideIcon,
} from 'lucide-react'
import type { AuthHeroSection as AuthHeroSectionType } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

const ICON_MAP: Record<string, LucideIcon> = {
  Zap, LayoutGrid, GitBranch, Globe, Eye,
}

interface Props {
  section: AuthHeroSectionType
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function AuthHeroSection({ section, translationId, translationRow }: Props) {
  if (!section) return null

  const tr = translationRow

  const headline   = tr?.auth_hero_headline    ?? section.headline   ?? 'CMS-driven publishing for engineering teams.'
  const badge      = tr?.auth_hero_badge       ?? section.badge
  const footerNote = tr?.auth_hero_footer_note ?? section.footerNote ?? 'Powered by Supabase Auth'
  const rawFeatures = section.features ?? []

  // Merge per-feature translation text (if set) over the sections-JSON text
  const featureTexts: (string | null | undefined)[] = [
    tr?.auth_hero_feature_1_text,
    tr?.auth_hero_feature_2_text,
    tr?.auth_hero_feature_3_text,
  ]
  const featureFields = ['auth_hero_feature_1_text', 'auth_hero_feature_2_text', 'auth_hero_feature_3_text']

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
          <span
            data-directus={pageAttr(translationId, 'auth_hero_badge')}
            className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
          >
            {badge}
          </span>
        )}

        <h1
          data-directus={pageAttr(translationId, 'auth_hero_headline')}
          className="text-white text-5xl font-bold leading-tight tracking-tight"
        >
          {headline}
        </h1>

        {rawFeatures.length > 0 && (
          <ul className="space-y-4">
            {rawFeatures.map((f, i) => {
              const IconComp = f.icon ? ICON_MAP[f.icon] : null
              const text = featureTexts[i] ?? f.text
              return (
                <li key={f._key ?? i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {IconComp
                      ? <IconComp size={16} className="text-indigo-400" />
                      : <span className="text-white/40 text-sm">✦</span>
                    }
                  </div>
                  <span
                    data-directus={featureFields[i] ? pageAttr(translationId, featureFields[i]) : undefined}
                    className="text-white/55 text-sm font-medium"
                  >
                    {text}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span
          data-directus={pageAttr(translationId, 'auth_hero_footer_note')}
          className="text-white/25 text-xs uppercase tracking-widest"
        >
          {footerNote}
        </span>
      </div>
    </div>
  )
}