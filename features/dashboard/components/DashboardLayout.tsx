// features/dashboard/components/DashboardLayout.tsx
// Server component — fetches siteConfig and passes layout content to the
// built-in Sidebar, MobileTopBar, and MobileBottomNav components.
//
// Data flow:
//   siteConfig.sidebarConfig.navItems  → Sidebar + MobileBottomNav
//   Falls back to siteConfig.sidebarNav (legacy) → same components
//   No CMS data → hardcoded fallback inside SidebarNav / MobileBottomNav
import { Suspense } from 'react'
import { getSiteConfig } from '@/lib/directus/queries'
import { Sidebar } from './Sidebar'
import { MobileTopBar } from './MobileTopBar'
import { MobileBottomNav } from './MobileBottomNav'
import { DraftPostToast } from '@/features/posts/components/DraftPostToast'

interface DashboardLayoutProps {
  children: React.ReactNode
  lang?: string
}

export async function DashboardLayout({ children, lang = 'en' }: DashboardLayoutProps) {
  const siteConfig = await getSiteConfig()

  const sidebarConfig   = siteConfig?.sidebarConfig ?? null
  const navItems        = sidebarConfig?.navItems ?? []
  const mobileNavConfig = siteConfig?.mobileNavConfig ?? null
  const mobileNavItems  = mobileNavConfig?.items ?? navItems

  return (
    <div className="flex h-screen bg-[#0d0e14] overflow-hidden">
      {/* Sidebar — desktop only */}
      <Sidebar navItems={navItems} lang={lang} sidebarConfig={sidebarConfig} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar — logo + avatar */}
        <MobileTopBar />

        {/* Draft post toast — fires when ?draft=1 is present in the URL */}
        <Suspense>
          <DraftPostToast />
        </Suspense>

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="w-full max-w-5xl mx-auto py-6 px-4 lg:px-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav navItems={mobileNavItems} lang={lang} showLabels={mobileNavConfig?.showLabels} />
      </div>
    </div>
  )
}
