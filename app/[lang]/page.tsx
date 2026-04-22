// app/[lang]/page.tsx
//
// Handles ALL routes at depth 1:
//
//   LANGUAGE HOMEPAGES:
//     /hi  → LanguageHomePage lang='hi'  → resolves 'home' page in Hindi
//     /kn  → LanguageHomePage lang='kn'  → resolves 'home' page in Kannada
//
//   ENGLISH SLUG PAGES (lang param IS the slug):
//     /login    → resolves 'login' page   → authSection renders auth form
//     /signup   → resolves 'signup' page  → authSection renders auth form
//     /posts    → resolves 'posts' page   → postsTable section renders posts UI
//     /settings → resolves 'settings' page → settingsForm section renders settings
//     /billing  → resolves 'billing' page  → billingPlansGrid section renders billing
//     /admin    → resolves 'admin' page    → admin section renders admin
//     /analytics → resolves 'analytics' page → analytics section renders analytics
//     /any-post-slug → falls through to post lookup
//
// MULTILINGUAL RULE:
//   Every section receives lang={lang} and uses it to pick translated text.
//   If a page document doesn't exist in the requested language, it falls back to English.

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
  isSupportedLang,
  SUPPORTED_LANGUAGES,
  LANG_LABELS,
  type SupportedLang,
  type SlugEntry,
} from '@/lib/directus/pageResolver'
import { buildMetadata } from '@/lib/seo'
import { SectionRenderer } from '@/sections/SectionRenderer'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { PostDetail } from '@/features/posts/components/PostDetail'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { DirectusPage, DirectusPost } from '@/types/directus'
import { editableAttr } from '@/lib/directus/visual-editing'
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

export const revalidate = 60

interface Props {
  params: Promise<{ lang: string }>
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

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Only pre-render the language homepages at build time.
  // All English slug pages (/posts, /login, /[post-slug], …) and non-English
  // slug pages are ISR'd on first request (revalidate = 60) to stay well under
  // Directus Cloud's 50 req/window rate limit during Vercel static generation.
  return [{ lang: 'hi' }, { lang: 'kn' }]
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params

  if (lang === 'en') return {}

  // Language homepages (/hi, /kn)
  if (isSupportedLang(lang)) {
    const page = await getPageBySlugAndLang('home', lang)
    return buildMetadata({
      slug: 'home', lang,
      title: page?.seoTitle ?? page?.title,
      description: page?.seoDescription,
      ogImage: page?.ogImage,
    })
  }

  // English slug page — fetch whichever is found (page or post)
  const slug = lang
  const [page, post] = await Promise.all([
    getPageBySlugAndLang(slug, 'en'),
    getPostBySlugAndLang(slug, 'en'),
  ])

  const doc = page ?? post
  if (!doc) return {}

  const title = ('seoTitle' in doc && doc.seoTitle) ? doc.seoTitle : doc.title
  const description = ('seoDescription' in doc && doc.seoDescription)
    ? doc.seoDescription
    : ('excerpt' in doc ? doc.excerpt : undefined)
  const ogImage = 'ogImage' in doc ? doc.ogImage : undefined

  return buildMetadata({ slug, lang: 'en', title, description, ogImage })
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function LangOrSlugPage({ params }: Props) {
  const { lang } = await params

  // /en/* → always redirect to canonical English URL (no prefix)
  if (lang === 'en') redirect('/')

  // /hi or /kn → language homepage
  if (isSupportedLang(lang)) {
    return <LanguageHomePage lang={lang as SupportedLang} />
  }

  // /login, /signup, /posts, /settings, /billing, /admin, /analytics, /[post-slug]
  // lang param IS the slug here (English routes don't have a lang prefix)
  return <EnglishSlugPage slug={lang} />
}

// ── Language homepage (/hi or /kn) ────────────────────────────────────────────

async function LanguageHomePage({ lang }: { lang: SupportedLang }) {
  const page = await getPageBySlugAndLang('home', lang)
  if (!page) notFound()
  return <RenderPage page={page} lang={lang} />
}

// ── Post detail config assembler ──────────────────────────────────────────────
// With Directus, post-detail labels are sourced from the page's sections JSON.
// If the postDetail page isn't seeded, all labels fall back to hardcoded defaults
// inside PostDetail.tsx — no query failure, safe for demo.

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

// ── English slug page (/login, /signup, /posts, etc.) ─────────────────────────

async function EnglishSlugPage({ slug }: { slug: string }) {
  // Try page first
  const page = await getPageBySlugAndLang(slug, 'en')
  if (page) return <RenderPage page={page} lang="en" />

  // Try post
  const post = await getPostBySlugAndLang(slug, 'en')
  if (!post) notFound()

  // Adjacent posts for prev/next navigation
  const [variants, orderedSlugs] = await Promise.all([
    getPostLangVariants(slug),
    getPostSlugsByLang('en'),
  ])

  const currentIndex = orderedSlugs.indexOf(slug)
  const prevSlug = currentIndex < orderedSlugs.length - 1 ? orderedSlugs[currentIndex + 1] : null
  const nextSlug = currentIndex > 0 ? orderedSlugs[currentIndex - 1] : null

  const variantMap = Object.fromEntries(variants.map((v) => [v.language, v.slug]))

  // Post-detail labels: Directus doesn't have a separate postDetail sections query.
  // PostDetail.tsx has hardcoded fallbacks for all label props — passing empty config is safe.
  const { header, meta, body, tags, backLink } = assemblePostDetailConfig([])

  const postData = {
    _id:           post._id,
    title:         post.title,
    slug:          post.slug,
    body:          (post.body ?? []) as unknown[],
    tags:          post.tags ?? [],
    featured:      post.featured ?? false,
    publishedAt:   post.publishedAt ?? null,
    coverImage:    post.coverImage ?? null,
    authorId:      post.authorId,
    authorName:    post.authorName,
    authorEmail:   post.authorEmail,
    authorAvatar:  post.authorAvatar ?? null,
    translationId: post.resolvedTranslationId ?? null,
  }

  return (
    <DashboardLayout lang="en">
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
                  l === 'en'
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
        lang="en"
        headerContent={header}
        metaContent={meta}
        bodyContent={body}
        tagsContent={tags}
        backLinkContent={{ ...backLink, backHref: backLink.backHref ?? '/posts' }}
      />
    </DashboardLayout>
  )
}

// ── Render page — shared by all page types ─────────────────────────────────────

async function RenderPage({ page, lang }: { page: DirectusPage; lang: string }) {
  const access = getPageAccess(page)

  // Auth check
  if (access.requireAuth) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const redirectTo = lang === 'en'
        ? `/${page.slug?.current ?? ''}`
        : `/${lang}/${page.slug?.current ?? ''}`
      redirect(`/login?redirectTo=${redirectTo}`)
    }

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
  const typedLang = lang as SupportedLang

  const trAttr = editableAttr({
    collection: 'pages_translations',
    item: page.resolvedTranslationId ?? null,
    fields: 'sections',
    mode: 'drawer',
  })

  // Dashboard layout
  if (access.showSidebar) {
    return (
      <DashboardLayout lang={typedLang}>
        {sections.length > 0 ? (
          <div data-directus={trAttr}>
            <SectionRenderer sections={sections} lang={typedLang} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/30 text-sm">This page has no sections yet.</p>
          </div>
        )}
      </DashboardLayout>
    )
  }

  // Auth layout (no chrome) — lg:flex assembles the 2-column layout:
  // authHeroSection (left 45%) + authSection (right flex-1)
  if (access.isAuth) {
    return sections.length > 0 ? (
      <div className="min-h-screen bg-[#0d0e14] lg:flex lg:flex-wrap" data-directus={trAttr}>
        <SectionRenderer sections={sections} lang={typedLang} />
      </div>
    ) : (
      <div className="min-h-screen bg-[#0d0e14]" />
    )
  }

  // Public layout (Navbar + Footer)
  const [siteConfig, navPages] = await Promise.all([
    getSiteConfig(),
    getNavPages(lang),
  ])

  return (
    <div className="min-h-screen bg-[#0d0e14]">
      <Navbar siteConfig={siteConfig as unknown as SiteConfig} navPages={navPages as unknown as NavPage[]} lang={typedLang} />
      {sections.length > 0 ? (
        <div data-directus={trAttr}>
          <SectionRenderer sections={sections} lang={typedLang} />
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-white/30 text-sm">No sections configured for this page.</p>
        </div>
      )}
      <Footer siteConfig={siteConfig as unknown as SiteConfig} lang={typedLang} />
    </div>
  )
}
