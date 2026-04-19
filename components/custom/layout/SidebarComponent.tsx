'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ComponentSidebarContent } from '@/types/cms'

interface Props {
  component: ComponentSidebarContent
  collapsed?: boolean
  onToggle?: () => void
}

export function SidebarComponent({ component, collapsed = false, onToggle }: Props) {
  const pathname = usePathname()
  const {
    logoText = 'ContentFlow',
    logoHref = '/',
    navItems = [],
    footerItems = [],
    collapsible = true,
    showUserProfile = true,
  } = component

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-[#0d0e14] border-r border-white/8 transition-all duration-200',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo row */}
      <div className="h-14 flex items-center px-4 border-b border-white/8 shrink-0">
        <Link
          href={logoHref}
          className={cn('font-bold text-sm text-white transition-opacity', collapsed && 'opacity-0 pointer-events-none')}
        >
          {logoText}
        </Link>
        {collapsible && (
          <button
            onClick={onToggle}
            className="ml-auto p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="1.5" rx="0.75" />
              <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" />
              <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" />
            </svg>
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item, i) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={i}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'text-white/50 hover:text-white hover:bg-white/5',
                  )}
                >
                  {item.icon && (
                    <span className="text-[15px] shrink-0 w-4 flex items-center justify-center opacity-70">
                      {/* Icon name stored as Lucide string — render a generic fallback circle */}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>
                    </span>
                  )}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer items */}
      {footerItems.length > 0 && (
        <div className="border-t border-white/8 py-3 px-2">
          <ul className="space-y-0.5">
            {footerItems.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User profile stub */}
      {showUserProfile && !collapsed && (
        <div className="border-t border-white/8 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/40 shrink-0" />
            <span className="text-xs text-white/40 truncate">User Profile</span>
          </div>
        </div>
      )}
    </aside>
  )
}
