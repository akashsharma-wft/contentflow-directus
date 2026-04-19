// features/dashboard/components/SidebarNav.tsx
// Client component — receives nav items as props from server component.
// Builds language-aware hrefs so /hi/posts, /kn/billing etc work correctly.
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { ICON_MAP, filterByVisibility, getNavItemLabel, getNavRole, localizeHref } from '@/lib/navigation'
import type { SiteNavItem } from '@/types/cms'

interface SidebarNavProps {
  collapsed: boolean
  navItems?: SiteNavItem[]
  lang?: string
}

function isPathActive(pathname: string, localizedHref: string): boolean {
  return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
}

export function SidebarNav({ collapsed, navItems = [], lang = 'en' }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, profile } = useUser()

  const role  = getNavRole(user?.id, profile?.role)
  const items = filterByVisibility(navItems, role)

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {items.map((item) => {
        const Icon          = (item.icon && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : ICON_MAP.FileText
        const localizedHref = localizeHref(item.href, lang)
        const isActive      = isPathActive(pathname, localizedHref)
        const label         = getNavItemLabel(item.label, lang)

        return (
          <Link
            key={item._key || item.href}
            href={localizedHref}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group',
              isActive
                ? 'bg-indigo-500/15 text-white border border-indigo-500/20'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/60'
            )} />
            {!collapsed && <span>{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}