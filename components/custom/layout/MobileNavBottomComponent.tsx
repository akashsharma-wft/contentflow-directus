'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ComponentMobileNavBottomContent } from '@/types/cms'

interface Props {
  component: ComponentMobileNavBottomContent
}

export function MobileNavBottomComponent({ component }: Props) {
  const pathname = usePathname()
  const { items = [], showLabels = true } = component

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0d0e14] border-t border-white/8 flex items-center justify-around px-2">
      {items.map((item, i) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={i}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 rounded-lg transition-colors',
              active ? 'text-indigo-400' : 'text-white/40 hover:text-white',
            )}
          >
            {/* Generic icon placeholder — real icons come from Lucide in app code */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
              <circle cx="12" cy="12" r="9"/>
            </svg>
            {showLabels && (
              <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
