// sections/HeroSection.tsx
// Every visible text element is individually bound to its own Directus field.
// Hovering any text in visual editing mode opens a drawer pre-focused on
// exactly that field — not the entire sections JSON blob.

import Link from 'next/link'
import type { HeroSection as HeroSectionType } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { HeroPrimaryCta } from './_HeroPrimaryCta'
import { editableAttr } from '@/lib/directus/visual-editing'

interface Props {
  section:        HeroSectionType
  translationId?: number
  translationRow?: DirectusPageTranslationRow
}

export function HeroSection({ section, translationId, translationRow }: Props) {
  // Prefer the flat fields from the translation row over the section JSON
  // (flat fields are the canonical source after migration; section JSON is fallback)
  const tr = translationRow

  const heading       = tr?.hero_heading             ?? section.heading        ?? ''
  const subheading    = tr?.hero_subheading          ?? section.subheading     ?? ''
  const badge         = tr?.hero_badge               ?? section.badge          ?? ''
  const communityText = tr?.hero_community_text      ?? section.communityText  ?? ''
  const primaryLabel  = tr?.hero_primary_cta_label   ?? section.primaryCta?.label  ?? ''
  const primaryHref   = tr?.hero_primary_cta_href    ?? section.primaryCta?.href   ?? '#'
  const secondaryLabel = tr?.hero_secondary_cta_label ?? section.secondaryCta?.label ?? ''
  const secondaryHref  = tr?.hero_secondary_cta_href  ?? section.secondaryCta?.href  ?? '#'
  const layout        = section.layout ?? 'centered'

  // Helper to build data-directus attr targeting an exact field
  function attr(field: keyof DirectusPageTranslationRow) {
    return editableAttr({
      collection: 'pages_translations',
      item: translationId ?? null,
      fields: field as string,
      mode: 'drawer',
    })
  }

  if (layout === 'split') {
    return (
      <section className="relative w-full bg-[#0d0e14] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-0 min-h-[580px] items-center">
          <div className="py-20 lg:py-28 space-y-7 lg:pr-12">

            {badge && (
              <span
                data-directus={attr('hero_badge')}
                className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
              >
                {badge}
              </span>
            )}

            <h1
              data-directus={attr('hero_heading')}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-white"
            >
              {heading}
            </h1>

            {subheading && (
              <p
                data-directus={attr('hero_subheading')}
                className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg"
              >
                {subheading}
              </p>
            )}

            {(primaryLabel || secondaryLabel) && (
              <div className="flex items-center gap-3 flex-wrap">
                {primaryLabel && primaryHref && (
                  <span data-directus={attr('hero_primary_cta_label')}>
                    <HeroPrimaryCta
                      label={primaryLabel}
                      href={primaryHref}
                      className="px-5 py-2.5 bg-white text-[#0d0e14] hover:bg-white/90 font-semibold rounded-xl transition-colors text-sm"
                    />
                  </span>
                )}
                {secondaryLabel && secondaryHref && (
                  <Link
                    href={secondaryHref}
                    data-directus={attr('hero_secondary_cta_label')}
                    className="px-5 py-2.5 border border-white/15 text-white/70 hover:border-white/30 hover:text-white font-semibold rounded-xl transition-colors text-sm inline-flex items-center gap-1.5"
                  >
                    {secondaryLabel}
                    <span className="text-white/40">→</span>
                  </Link>
                )}
              </div>
            )}

            {communityText && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  {['#6366f1', '#8b5cf6', '#ec4899'].map((color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-[#0d0e14] flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span
                  data-directus={attr('hero_community_text')}
                  className="text-[11px] font-semibold uppercase tracking-widest text-white/30"
                >
                  {communityText}
                </span>
              </div>
            )}
          </div>

          {/* Decorative right panel — no editable content */}
          <div className="hidden lg:flex items-center justify-center relative h-full min-h-[580px]">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-indigo-600/20 blur-[80px] pointer-events-none" />
            <div className="absolute right-16 top-1/3 w-[200px] h-[200px] rounded-full bg-purple-600/15 blur-[60px] pointer-events-none" />
            <div className="relative z-10 w-[340px] space-y-3">
              <div className="bg-[#13141c] border border-white/8 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Featured</span>
                  <span className="text-white/20 text-xs font-mono">EN</span>
                </div>
                <div className="h-2.5 w-3/4 bg-white/10 rounded-full" />
                <div className="h-2 w-full bg-white/5 rounded-full" />
                <div className="h-2 w-5/6 bg-white/5 rounded-full" />
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/40" />
                  <div className="h-1.5 w-20 bg-white/10 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ color: 'bg-emerald-500/20', label: 'Design' }, { color: 'bg-purple-500/20', label: 'Engineering' }].map(({ color, label }) => (
                  <div key={label} className="bg-[#13141c] border border-white/8 rounded-xl p-4 space-y-2">
                    <div className={`w-8 h-8 rounded-lg ${color} mb-2`} />
                    <div className="h-2 w-full bg-white/10 rounded-full" />
                    <div className="h-1.5 w-3/4 bg-white/5 rounded-full" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-white/20">{label}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#13141c] border border-white/8 rounded-xl px-5 py-3 flex items-center justify-between">
                {[{ val: '3', lbl: 'Languages' }, { val: '∞', lbl: 'Posts' }, { val: '< 1s', lbl: 'TTFB' }].map(({ val, lbl }) => (
                  <div key={lbl} className="text-center">
                    <p className="text-white font-bold text-sm">{val}</p>
                    <p className="text-white/30 text-[10px]">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Centered layout
  return (
    <section className="relative w-full min-h-120 flex items-center justify-center px-6 py-20 overflow-hidden bg-[#0d0e14]">
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        {badge && (
          <span
            data-directus={attr('hero_badge')}
            className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 rounded-full"
          >
            {badge}
          </span>
        )}
        <h1
          data-directus={attr('hero_heading')}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-white"
        >
          {heading}
        </h1>
        {subheading && (
          <p
            data-directus={attr('hero_subheading')}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-white/55"
          >
            {subheading}
          </p>
        )}
        {(primaryLabel || secondaryLabel) && (
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            {primaryLabel && (
              <span data-directus={attr('hero_primary_cta_label')}>
                <HeroPrimaryCta
                  label={primaryLabel}
                  href={primaryHref}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors text-sm"
                />
              </span>
            )}
            {secondaryLabel && (
              <Link
                href={secondaryHref}
                data-directus={attr('hero_secondary_cta_label')}
                className="px-6 py-3 font-semibold rounded-xl transition-colors text-sm border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}