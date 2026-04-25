'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useSearchParams } from 'next/navigation'
import { SidebarLogo } from './SidebarLogo'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter } from './SidebarFooter'
import { CollapsedSignOut } from './CollapsedSignOut'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/utils'
import type { SiteNavItem, SiteSidebarConfig } from '@/types/cms'

interface StatusBarProps {
  statusText?: string
  statusBadge?: string
}

function StatusBar({ statusText = 'Built with ContentFlow SDK', statusBadge = 'System Status: Nominal' }: StatusBarProps) {
  return (
    <div className="px-4 py-2 border-t border-white/5">
      <p className="text-white/15 text-[9px] uppercase tracking-widest leading-relaxed">
        {statusText}
        <span className="mx-1.5">·</span>
        <span className="text-emerald-500/60">{statusBadge}</span>
      </p>
    </div>
  )
}

interface SidebarProps {
  navItems: SiteNavItem[]
  lang?: string
  sidebarConfig?: SiteSidebarConfig | null
}

export function Sidebar({ navItems, lang = 'en', sidebarConfig }: SidebarProps) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const searchParams = useSearchParams()
  // In the Directus visual editor the sidebar must stay expanded so all nav
  // labels are visible and editors can see the full navigation structure.
  const isVisualEditor = searchParams.get('visual-editing') === 'true'
  const effectiveOpen = isVisualEditor ? true : sidebarOpen

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full shrink-0 bg-[#0d0e14] border-r border-white/5',
        'transition-all duration-200 overflow-hidden',
        effectiveOpen ? 'w-55' : 'w-14'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex items-center py-4 px-3 shrink-0',
        effectiveOpen ? 'justify-between' : 'justify-center'
      )}>
        {effectiveOpen && (
          <SidebarLogo
            lang={lang}
            brandName={sidebarConfig?.brandName}
            brandSubtitle={sidebarConfig?.brandSubtitle}
          />
        )}
        {/* Hide the collapse toggle in visual editor so editors can't accidentally collapse */}
        {!isVisualEditor && (
          <button
            onClick={toggleSidebar}
            className="text-white/30 hover:text-white/70 hover:bg-white/5 p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
            aria-label={effectiveOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {effectiveOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <SidebarNav collapsed={!effectiveOpen} navItems={navItems} lang={lang} />

      {/* Language switcher — only shown when expanded */}
      {effectiveOpen && (
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
          <span className="text-white/20 text-[9px] uppercase tracking-widest font-mono">Language</span>
          <LanguageSwitcher />
        </div>
      )}

      {/* Footer */}
      {effectiveOpen ? (
        <>
          <SidebarFooter
            ctaButton={sidebarConfig?.ctaButton}
            footerLinks={sidebarConfig?.footerLinks}
          />
          <StatusBar
            statusText={sidebarConfig?.statusText}
            statusBadge={sidebarConfig?.statusBadge}
          />
        </>
      ) : (
        <div className="mt-auto pb-4 flex flex-col items-center gap-1 px-2">
          <div className="w-full h-px bg-white/5 mb-2" />
          <CollapsedSignOut />
        </div>
      )}
    </aside>
  )
}