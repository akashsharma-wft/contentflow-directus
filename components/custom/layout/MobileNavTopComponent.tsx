'use client'

import Link from 'next/link'
import type { ComponentMobileNavTopContent } from '@/types/cms'

interface Props {
  component: ComponentMobileNavTopContent
  onMenuOpen?: () => void
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  search:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  notify:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  profile:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

export function MobileNavTopComponent({ component, onMenuOpen }: Props) {
  const {
    logoText = 'ContentFlow',
    showLogo = true,
    showMenuButton = true,
    actions = [],
  } = component

  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-14 flex items-center justify-between px-4 bg-[#0d0e14] border-b border-white/8">
      {/* Left: hamburger */}
      {showMenuButton && (
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      {/* Center: logo */}
      {showLogo && (
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-sm">
          {logoText}
        </Link>
      )}

      {/* Right: action icons */}
      <div className="flex items-center gap-1 ml-auto">
        {actions.map((action, i) => (
          <button
            key={i}
            aria-label={action.label ?? action.type}
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            {ACTION_ICON[action.type ?? ''] ?? null}
          </button>
        ))}
      </div>
    </header>
  )
}
