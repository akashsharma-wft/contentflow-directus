// components/Footer.tsx
//
// FIX: app/page.tsx and app/[lang]/page.tsx pass lang={...} to <Footer>.
// Props only had 'siteConfig', so TypeScript rejected 'lang'.
// Solution: add optional lang prop. Footer already reads lang from pathname
// internally, so lang prop is accepted but not required — purely a type fix.
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV_ITEMS, filterNavItems, localizeHref, getLocalizedLabel, resolveLabel } from '@/lib/navigation'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'
import type { SiteConfig } from '@/types/cms'
import { siteAttr, siteTranslationAttr } from '@/lib/directus/section-binding'

interface Props {
  siteConfig: SiteConfig | null
  /** Optional — accepted for backwards compat but not used (lang is derived from pathname). */
  lang?: string
}

const LANG_CODES = ['en', 'hi', 'kn'] as const

function parseCurrentLang(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'en'
  const first = segments[0]
  if ((LANG_CODES as readonly string[]).includes(first)) return first
  return 'en'
}

export function Footer({ siteConfig }: Props) {
  const pathname = usePathname()
  const { profile } = useUser()

  // Only show footer on home page (/ or /{lang})
  const isHomePage = pathname === '/' || (LANG_CODES as readonly string[]).includes(pathname.slice(1))
  if (!isHomePage) return null

  const currentLang    = parseCurrentLang(pathname)
  const cfg            = siteConfig?.footerConfig
  const brandName      = cfg?.brandName ?? siteConfig?.siteName ?? 'ContentFlow'
  const showBrandLogo  = cfg?.showBrandLogo ?? true
  const tagline        = resolveLabel(
    cfg?.tagline ?? siteConfig?.footerTagline,
    currentLang,
    'A next-generation CMS platform dedicated to the art of storytelling and editorial excellence. Built for modern publishers.',
  )
  const copyright      = resolveLabel(
    cfg?.copyright ?? siteConfig?.copyright,
    currentLang,
    `© ${new Date().getFullYear()} ContentFlow. All rights reserved.`,
  )
  const footerColumns  = cfg?.columns ?? []
  const socialLinks    = cfg?.socialLinks ?? []
  const bottomLinks    = cfg?.bottomLinks ?? []
  const navItems       = filterNavItems(APP_NAV_ITEMS, profile?.role)

  return (
    <footer className="w-full border-t border-white/6 bg-[#0d0e14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 pb-12 border-b border-white/6">

          {/* Brand column */}
          <div className="space-y-4">
            {showBrandLogo && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                    <path d="M3 9h9m0 0-3-3m3 3-3 3M12 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  data-directus={siteAttr('footer_brand_name')}
                  className="text-white font-semibold text-sm tracking-tight"
                >{brandName}</span>
              </div>
            )}
            <p
              data-directus={siteTranslationAttr(siteConfig?.siteConfigTranslationId, 'footer_tagline')}
              className="text-white/35 text-xs leading-relaxed max-w-[220px]"
            >{tagline}</p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialLinks.map((s) => (
                  <Link
                    key={s._key}
                    href={s.href ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors text-[10px] font-bold uppercase"
                  >
                    {s.platform?.slice(0, 2)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Link columns — CMS-driven if configured, else fallback nav */}
          <div className="sm:col-span-3">
            {footerColumns.length > 0 ? (
              <div className={cn(
                'grid grid-cols-2 gap-8',
                footerColumns.length >= 4 ? 'sm:grid-cols-4'
                : footerColumns.length === 3 ? 'sm:grid-cols-3'
                : 'sm:grid-cols-2'
              )}>
                {footerColumns.map((col, ci) => (
                  <div key={col._key} className="space-y-3">
                    <p
                      data-directus={siteTranslationAttr(siteConfig?.siteConfigTranslationId, `footer_col_${ci + 1}_heading`)}
                      className="text-white/30 text-[10px] font-bold uppercase tracking-widest"
                    >{resolveLabel(col.heading, currentLang)}</p>
                    <ul className="space-y-2">
                      {col.links?.map((link, li) => (
                        <li key={link._key}>
                          <Link
                            href={link.external ? link.href : localizeHref(link.href, currentLang)}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noopener noreferrer' : undefined}
                            data-directus={siteTranslationAttr(siteConfig?.siteConfigTranslationId, `footer_col_${ci + 1}_link_${li + 1}_label`)}
                            className="text-white/50 text-sm hover:text-white transition-colors"
                          >
                            {resolveLabel(link.label, currentLang)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-4">Navigation</p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
                  {navItems.map((item) => {
                    const url = localizeHref(item.href, currentLang)
                    return (
                      <li key={item.href}>
                        <Link href={url} className="text-white/50 text-sm hover:text-white transition-colors">
                          {getLocalizedLabel(item.label, currentLang)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/25">
          <span
            data-directus={siteTranslationAttr(siteConfig?.siteConfigTranslationId, 'footer_copyright')}
            className="uppercase tracking-widest"
          >{copyright}</span>
          {bottomLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {bottomLinks.map((link) => (
                <Link
                  key={link._key}
                  href={link.external ? link.href : localizeHref(link.href, currentLang)}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="hover:text-white/60 transition-colors uppercase tracking-widest"
                >
                  {resolveLabel(link.label, currentLang)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}