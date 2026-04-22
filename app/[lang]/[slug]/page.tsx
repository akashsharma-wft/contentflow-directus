// app/[lang]/[slug]/page.tsx
//
// Handles Hindi and Kannada content at /hi/slug and /kn/slug.
// English content lives at /[slug] (handled by app/[lang]/page.tsx).
//
// For CMS pages → SectionRenderer inside the appropriate layout.
// For posts     → DashboardLayout + PostDetail with CMS-sourced labels.

import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import {
  getPageBySlugAndLang,
  getPostBySlugAndLang,
  getSiteConfig,
  getNavPages,
  getPostLangVariants,
  getPostSlugsByLang,
} from '@/lib/directus/queries'
import {
  SUPPORTED_LANGUAGES,
  LANG_LABELS,
  type SupportedLang,
} from '@/lib/directus/pageResolver'
import { buildMetadata } from '@/lib/seo'
import { SectionRenderer } from '@/sections/SectionRenderer'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { PostDetail } from '@/features/posts/components/PostDetail'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { DirectusPage } from '@/types/directus'
import type {
  SiteConfig,
  NavPage,
  PageSection,
  SectionPostDetailHeaderContent,
  SectionPostDetailMetaContent,
  SectionPostDetailBodyContent,
  SectionPostDetailTagsContent,
  SectionPostDetailBackLinkContent,
} from '@/types/cms'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ lang: string; slug: string }>
}

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

// ── Post detail config assembler ──────────────────────────────────────────────
// PostDetail.tsx has hardcoded fallbacks for all label props, so passing an
// empty section list is safe — labels degrade gracefully.
function assemblePostDetailConfig(sections: PageSection[]) {
  const header:   SectionPostDetailHeaderContent   = {}
  const meta:     SectionPostDetailMetaContent     = {}
  const body:     SectionPostDetailBodyContent     = {}
  const tags:     SectionPostDetailTagsContent     = {}
  const backLink: SectionPostDetailBackLinkContent = {}

  for (const s of sections) {
    if (s.sectionType === 'postDetailHeader'   && s.postDetailHeader)   Object.assign(header,   s.postDetailHeader)
    if (s.sectionType === 'postDetailMeta'     && s.postDetailMeta)     Object.assign(meta,     s.postDetailMeta)
    if (s.sectionType === 'postDetailBody'     && s.postDetailBody)     Object.assign(body,     s.postDetailBody)
    if (s.sectionType === 'postDetailTags'     && s.postDetailTags)     Object.assign(tags,     s.postDetailTags)
    if (s.sectionType === 'postDetailBackLink' && s.postDetailBackLink) Object.assign(backLink, s.postDetailBackLink)
  }

  return { header, meta, body, tags, backLink }
}

// ── Static params ──────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Return empty — all /[lang]/[slug] paths (hi/kn post and page detail) are
  // ISR'd on first request rather than pre-rendered at build time. This avoids
  // exhausting Directus Cloud's 50 req/window rate limit during Vercel builds.
  return []
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  if (lang !== 'hi' && lang !== 'kn') return {}

  const [page, post] = await Promise.all([
    getPageBySlugAndLang(slug, lang),
    getPostBySlugAndLang(slug, lang),
  ])

  const doc = page ?? post
  if (!doc) return {}

  const title = ('seoTitle' in doc && doc.seoTitle) ? doc.seoTitle : doc.title
  const description = ('seoDescription' in doc && doc.seoDescription)
    ? doc.seoDescription
    : ('excerpt' in doc ? doc.excerpt : undefined)
  const ogImage = 'ogImage' in doc ? doc.ogImage : undefined

  return buildMetadata({ slug, lang, title, description, ogImage })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LocalizedPage({ params }: Props) {
  const { lang, slug } = await params

  if (lang === 'en') redirect(`/${slug}`)
  if (lang !== 'hi' && lang !== 'kn') notFound()

  // 1. Try CMS page first
  const page = await getPageBySlugAndLang(slug, lang)

  if (page) {
    const access = getPageAccess(page)

    if (access.requireAuth) {
      const supabase = await createSupabaseServer()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) redirect(`/login?redirectTo=/${lang}/${slug}`)

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

    if (access.showSidebar) {
      return (
        <DashboardLayout lang={lang}>
          {sections.length > 0 ? (
            <SectionRenderer sections={sections} lang={lang} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-white/30 text-sm">This page has no sections yet.</p>
            </div>
          )}
        </DashboardLayout>
      )
    }

    if (access.isAuth) {
      return sections.length > 0 ? (
        <div className="min-h-screen bg-[#0d0e14] lg:flex lg:flex-wrap">
          <SectionRenderer sections={sections} lang={lang} />
        </div>
      ) : (
        <div className="min-h-screen bg-[#0d0e14]" />
      )
    }

    const [siteConfig, navPages] = await Promise.all([
      getSiteConfig(),
      getNavPages(lang),
    ])
    return (
      <div className="min-h-screen bg-[#0d0e14]">
        <Navbar siteConfig={siteConfig as unknown as SiteConfig} navPages={navPages as unknown as NavPage[]} lang={lang as SupportedLang} />
        {sections.length > 0 ? (
          <SectionRenderer sections={sections} lang={lang} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-white/30 text-sm">No sections configured for this page.</p>
          </div>
        )}
        <Footer siteConfig={siteConfig as unknown as SiteConfig} />
      </div>
    )
  }

  // 2. Try post — use DashboardLayout + PostDetail
  const post = await getPostBySlugAndLang(slug, lang)
  if (!post) notFound()

  // Adjacent posts for prev/next navigation
  const [variants, orderedSlugs] = await Promise.all([
    getPostLangVariants(slug),
    getPostSlugsByLang(lang),
  ])

  const currentIndex = orderedSlugs.indexOf(slug)
  const prevSlug = currentIndex < orderedSlugs.length - 1 ? orderedSlugs[currentIndex + 1] : null
  const nextSlug = currentIndex > 0 ? orderedSlugs[currentIndex - 1] : null

  const variantMap = Object.fromEntries(variants.map((v) => [v.language, v.slug]))

  // Post-detail labels degrade to hardcoded fallbacks in PostDetail.tsx
  const { header, meta, body, tags, backLink } = assemblePostDetailConfig([])
  const resolvedBackHref = backLink.backHref ?? `/${lang}/posts`

  const postData = {
    _id:          post._id,
    title:        post.title,
    slug:         post.slug,
    body:         (post.body ?? []) as unknown[],
    tags:         post.tags ?? [],
    featured:     post.featured ?? false,
    publishedAt:  post.publishedAt ?? null,
    coverImage:   post.coverImage ?? null,
    authorId:     post.authorId,
    authorName:   post.authorName,
    authorEmail:  post.authorEmail,
    authorAvatar: post.authorAvatar ?? null,
  }

  return (
    <DashboardLayout lang={lang}>
      {/* Language switcher row */}
      {variants.length > 1 && (
        <div className="flex items-center gap-2 mb-2 px-5 lg:px-8 pt-4">
          {SUPPORTED_LANGUAGES.map((l) => {
            const targetSlug = variantMap[l]
            if (!targetSlug) return null
            const url = l === 'en' ? `/${targetSlug}` : `/${l}/${targetSlug}`
            return (
              <a
                key={l}
                href={url}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                  l === lang
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {LANG_LABELS[l as SupportedLang]?.toUpperCase() ?? l.toUpperCase()}
              </a>
            )
          })}
        </div>
      )}

      <PostDetail
        post={postData}
        prevSlug={prevSlug}
        nextSlug={nextSlug}
        lang={lang}
        headerContent={header}
        metaContent={meta}
        bodyContent={body}
        tagsContent={tags}
        backLinkContent={{ ...backLink, backHref: resolvedBackHref }}
      />
    </DashboardLayout>
  )
}
