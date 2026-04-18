// app/page.tsx — English homepage at /
//
// ROUTING LOGIC:
//   - Reads the 'home' page document from Directus for language='en'
//   - Checks page.access: guest (public) / user (auth required) / admin
//   - Renders with page.layout: home (Navbar+Footer) / dashboard (Sidebar) / auth (no chrome)
//   - Passes the page's sections[] to SectionRenderer which maps sectionType → React component
//
// MULTILINGUAL:
//   - This file handles English only. Hindi is at /hi, Kannada at /kn.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { getPageBySlugAndLang, getSiteConfig, getNavPages } from '@/lib/directus/queries'
import { buildMetadata } from '@/lib/seo'
import { SectionRenderer } from '@/sections/SectionRenderer'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { DirectusPage } from '@/types/directus'
import type { SanitySiteConfig, NavPage } from '@/types/sanity'

export const revalidate = 60

// ── Access control helper ──────────────────────────────────────────────────────

function getPageAccess(page: DirectusPage) {
  return {
    requireAuth:  page.access === 'user' || page.access === 'admin',
    requireAdmin: page.access === 'admin',
    showSidebar:  page.layout === 'dashboard',
    showNavbar:   page.layout === 'home' || !page.layout,
    isAuth:       page.layout === 'auth',
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlugAndLang('home', 'en')

  return buildMetadata({
    slug: 'home',
    lang: 'en',
    title: page?.seoTitle ?? page?.title,
    description: page?.seoDescription,
    ogImage: page?.ogImage,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const page = await getPageBySlugAndLang('home', 'en')

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0d0e14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/30 text-sm">Home page not found in Directus.</p>
          <p className="text-white/20 text-xs">Run <code className="bg-white/5 px-2 py-0.5 rounded">npm run directus:seed</code> to create it.</p>
        </div>
      </div>
    )
  }

  const access = getPageAccess(page)

  // ── Auth check ──────────────────────────────────────────────────────────────
  if (access.requireAuth) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login?redirectTo=/')

    if (access.requireAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') redirect('/')
    }
  }

  const sections = page.sections ?? []

  // ── Dashboard layout (sidebar) ─────────────────────────────────────────────
  if (access.showSidebar) {
    return (
      <DashboardLayout lang="en">
        {sections.length > 0 ? (
          <SectionRenderer sections={sections} lang="en" />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/30 text-sm">This page has no sections yet.</p>
          </div>
        )}
      </DashboardLayout>
    )
  }

  // ── Auth layout (no chrome) ────────────────────────────────────────────────
  if (access.isAuth) {
    return sections.length > 0 ? (
      <div className="min-h-screen bg-[#0d0e14] lg:flex lg:flex-wrap">
        <SectionRenderer sections={sections} lang="en" />
      </div>
    ) : (
      <div className="min-h-screen bg-[#0d0e14]" />
    )
  }

  // ── Public layout (Navbar + Footer) ───────────────────────────────────────
  const [siteConfig, navPages] = await Promise.all([
    getSiteConfig(),
    getNavPages('en'),
  ])

  return (
    <div className="min-h-screen bg-[#0d0e14]">
      <Navbar siteConfig={siteConfig as unknown as SanitySiteConfig} navPages={navPages as unknown as NavPage[]} lang="en" />
      {sections.length > 0 ? (
        <SectionRenderer sections={sections} lang="en" />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-white/30 text-sm">No sections configured for this page.</p>
        </div>
      )}
      <Footer siteConfig={siteConfig as unknown as SanitySiteConfig} lang="en" />
    </div>
  )
}
