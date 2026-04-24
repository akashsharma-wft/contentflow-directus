'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ComponentNavbarContent } from '@/types/cms'
import { siteAttr, siteAttrs } from '@/lib/directus/section-binding'

interface Props {
  component: ComponentNavbarContent
}

export function NavbarComponent({ component }: Props) {
  const {
    logoText = 'ContentFlow',
    variant = 'solid',
    links = [],
    ctaButton,
    showAuth = true,
  } = component

  const bgClass = {
    solid:       'bg-[#0d0e14] border-b border-white/8',
    transparent: 'bg-transparent',
    blur:        'bg-[#0d0e14]/80 backdrop-blur-md border-b border-white/8',
  }[variant] ?? 'bg-[#0d0e14] border-b border-white/8'

  return (
    <nav className={cn('w-full sticky top-0 z-40', bgClass)}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link
          href="/"
          data-directus={siteAttr('navbar_brand_name')}
          className="text-white font-bold text-sm tracking-tight shrink-0"
        >
          {logoText}
        </Link>

        {/* Nav links */}
        {links.length > 0 && (
          <ul className="hidden md:flex items-center gap-1">
            {links.map((link, i) => (
              <li key={i}>
                <Link
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  data-directus={siteAttrs(`navbar_item_${i + 1}_label_en`, `navbar_item_${i + 1}_href`)}
                  className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {ctaButton?.label && ctaButton?.href && (
            <Link
              href={ctaButton.href}
              data-directus={siteAttrs('navbar_cta_label_en', 'navbar_cta_href')}
              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {ctaButton.label}
            </Link>
          )}
          {showAuth && !ctaButton?.label && (
            <>
              <Link href="/login"  className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="px-4 py-1.5 bg-white text-[#0d0e14] text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
