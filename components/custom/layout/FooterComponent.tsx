import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ComponentFooterContent } from '@/types/cms'
import { siteAttr, siteAttrs } from '@/lib/directus/section-binding'

interface Props {
  component: ComponentFooterContent
}

const SOCIAL_ICONS: Record<string, string> = {
  twitter:   'X',
  github:    'GH',
  linkedin:  'in',
  youtube:   'YT',
  instagram: 'IG',
}

export function FooterComponent({ component }: Props) {
  const {
    logoText,
    tagline,
    copyright = `© ${new Date().getFullYear()} ContentFlow. All rights reserved.`,
    columns = [],
    socialLinks = [],
    showLogo = true,
  } = component

  return (
    <footer className="w-full bg-[#0d0e14] border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* Top row: brand + columns */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">

          {/* Brand */}
          {showLogo && (
            <div className="space-y-3">
              <span data-directus={siteAttr('footer_brand_name')} className="text-white font-bold text-sm">{logoText ?? 'ContentFlow'}</span>
              {tagline && <p data-directus={siteAttr('footer_tagline_en')} className="text-white/40 text-xs leading-relaxed max-w-[180px]">{tagline}</p>}
              {socialLinks.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {socialLinks.map((s, i) => (
                    <Link
                      key={i}
                      href={s.href ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 hover:text-white transition-colors"
                    >
                      {SOCIAL_ICONS[s.platform ?? ''] ?? s.platform?.slice(0, 2).toUpperCase()}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link columns */}
          {columns.length > 0 && (
            <div className={cn(
              'grid grid-cols-2 gap-8',
              columns.length >= 4 ? 'sm:grid-cols-4'
              : columns.length === 3 ? 'sm:grid-cols-3'
              : 'sm:grid-cols-2'
            )}>
              {columns.map((col, ci) => (
                <div key={ci} className="space-y-3">
                  <p
                    data-directus={siteAttr(`footer_col_${ci + 1}_heading_en`)}
                    className="text-xs font-semibold uppercase tracking-widest text-white/30"
                  >
                    {col.heading}
                  </p>
                  <ul className="space-y-2">
                    {col.links?.map((link, li) => (
                      <li key={li}>
                        <Link
                          href={link.href ?? '#'}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          data-directus={siteAttrs(`footer_col_${ci + 1}_link_${li + 1}_label_en`, `footer_col_${ci + 1}_link_${li + 1}_href`)}
                          className="text-sm text-white/50 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-white/5">
          <p data-directus={siteAttr('footer_copyright_en')} className="text-xs text-white/30">{copyright}</p>
        </div>
      </div>
    </footer>
  )
}
