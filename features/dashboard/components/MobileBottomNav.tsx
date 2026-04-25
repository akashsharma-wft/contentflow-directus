// features/dashboard/components/MobileBottomNav.tsx
//
// Dashboard mobile bottom tab bar.
// Shows up to PRIMARY_LIMIT items directly in the bar.
// If more items exist, the last slot becomes a "More" button that opens
// an overflow popup listing the remaining items.
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ICON_MAP, filterByVisibility, getNavItemLabel, getNavRole, localizeHref } from '@/lib/navigation'
import { useUser } from '@/hooks/useUser'
import type { SiteNavItem } from '@/types/cms'

// Maximum items shown inline before overflow kicks in
const PRIMARY_LIMIT = 4

interface MobileBottomNavProps {
  navItems?:   SiteNavItem[]
  lang?:       string
  showLabels?: boolean
}

export function MobileBottomNav({ navItems = [], lang = 'en', showLabels = true }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { user, profile } = useUser()
  const [overflowOpen, setOverflowOpen] = useState(false)

  const role     = getNavRole(user?.id, profile?.role)
  const allItems = filterByVisibility(navItems, role)

  // Split into primary (visible in bar) and overflow
  const hasOverflow    = allItems.length > PRIMARY_LIMIT
  const primaryItems   = hasOverflow ? allItems.slice(0, PRIMARY_LIMIT - 1) : allItems
  const overflowItems  = hasOverflow ? allItems.slice(PRIMARY_LIMIT - 1)    : []

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-[#0d0e14] border-t border-white/5">
        {primaryItems.map((item) => {
          const Icon          = (item.icon && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : ICON_MAP.FileText
          const localizedHref = localizeHref(item.href, lang)
          const isActive      = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
          const label         = getNavItemLabel(item.label, lang)

          return (
            <Link
              key={item._key || item.href}
              href={localizedHref}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all cursor-pointer',
                isActive ? 'text-indigo-400' : 'text-white/25 hover:text-white/50'
              )}
            >
              <Icon size={17} className="shrink-0" />
              {showLabels && (
                <span className={cn(
                  'text-[9px] uppercase tracking-wider font-medium',
                  isActive ? 'text-indigo-400' : 'text-current'
                )}>
                  {label}
                </span>
              )}
            </Link>
          )
        })}

        {/* Overflow "More" button */}
        {hasOverflow && (
          <button
            onClick={() => setOverflowOpen((o) => !o)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all cursor-pointer',
              overflowOpen ? 'text-indigo-400' : 'text-white/25 hover:text-white/50'
            )}
            aria-label="More navigation items"
          >
            {/* Grid icon for "More" */}
            <svg className="w-4.25 h-4.25 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            {showLabels && (
              <span className={cn(
                'text-[9px] uppercase tracking-wider font-medium',
                overflowOpen ? 'text-indigo-400' : 'text-current'
              )}>
                More
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Overflow popup — slides up above the More button */}
      {hasOverflow && overflowOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setOverflowOpen(false)}
          />
          {/* Menu */}
          <div className="fixed bottom-16 right-0 z-50 lg:hidden w-48 bg-[#0d0e14] border border-white/8 rounded-tl-xl shadow-xl overflow-hidden">
            {overflowItems.map((item) => {
              const Icon          = (item.icon && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : ICON_MAP.FileText
              const localizedHref = localizeHref(item.href, lang)
              const isActive      = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
              const label         = getNavItemLabel(item.label, lang)

              return (
                <Link
                  key={item._key || item.href}
                  href={localizedHref}
                  onClick={() => setOverflowOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                    isActive
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
