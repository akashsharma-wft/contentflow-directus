/**
 * lib/directus/queries.ts
 *
 * All CMS read functions for Directus.
 *
 * Multilingual strategy:
 *  - Posts and pages have a parent row (non-translatable fields) and a junction
 *    table (posts_translations / pages_translations) for per-language content.
 *  - Because Directus's one_field alias causes SQL SELECT bugs on this hosted
 *    instance, we fetch parents and translations in two separate requests, then
 *    merge them in application code.
 *  - mergePost / mergePage pick the best translation (preferred lang → 'en' fallback).
 *
 * Note: `as never` / `as unknown as T` casts work around narrow SDK inferred types.
 * At runtime the data matches our declared types exactly.
 */
import 'server-only'
import {
  readItems,
  readItem,
  aggregate,
} from '@directus/sdk'
import { directusClient, directusAdminClient } from './client'
import {
  mergePost,
  mergePage,
  toSiteConfig,
  type DirectusPost,
  type DirectusPage,
  type DirectusSiteConfig,
  type DirectusNavPage,
  type DirectusPostRow,
  type DirectusPageRow,
  type DirectusSiteConfigRow,
  type DirectusPostTranslationRow,
  type DirectusPageTranslationRow,
} from '@/types/directus'

// ─── Post parent fields (non-translatable) ────────────────────────────────────

const POST_PARENT_FIELDS = [
  'id', 'slug', 'cover_image', 'published_at', 'featured', 'tags',
  'author_id', 'author_name', 'author_email', 'author_avatar',
  'date_created', 'date_updated',
] as never

const POST_TR_FIELDS = [
  'id', 'posts_id', 'languages_code', 'title', 'excerpt', 'body', 'body_html',
  'seo_title', 'seo_description',
] as never

const PAGE_PARENT_FIELDS = [
  'id', 'slug', 'status', 'access', 'layout', 'og_image',
] as never

const PAGE_TR_FIELDS = [
  'id', 'pages_id', 'languages_code', 'title', 'sections',
  'seo_title', 'seo_description',
] as never

// ─── Two-step fetch helpers ───────────────────────────────────────────────────

/** Attach translations to post parent rows.
 * Uses the admin client so junction-table reads are never blocked by
 * public-token permissions — the parent IDs are already scoped by the
 * public client's published/featured filters above.
 */
async function attachPostTranslations(
  rows: DirectusPostRow[],
  langs: string[],
): Promise<DirectusPostRow[]> {
  if (!rows.length) return rows
  const ids = rows.map(r => r.id)
  const trs = (await directusAdminClient.request(
    readItems('posts_translations', {
      filter: { posts_id: { _in: ids }, languages_code: { _in: langs } } as never,
      fields: POST_TR_FIELDS,
      limit: -1,
    })
  )) as unknown as DirectusPostTranslationRow[]
  return rows.map(row => ({
    ...row,
    translations: trs.filter(t => t.posts_id === row.id),
  }))
}

/** Attach translations to page parent rows.
 * Uses the admin client for the same reason as attachPostTranslations.
 */
async function attachPageTranslations(
  rows: DirectusPageRow[],
  langs: string[],
): Promise<DirectusPageRow[]> {
  if (!rows.length) return rows
  const ids = rows.map(r => r.id)
  const trs = (await directusAdminClient.request(
    readItems('pages_translations', {
      filter: { pages_id: { _in: ids }, languages_code: { _in: langs } } as never,
      fields: PAGE_TR_FIELDS,
      limit: -1,
    })
  )) as unknown as DirectusPageTranslationRow[]
  return rows.map(row => ({
    ...row,
    translations: trs.filter(t => t.pages_id === row.id),
  }))
}

// ─── Posts ────────────────────────────────────────────────────────────────────

/** All published posts (all languages), ordered by date desc. */
export async function getAllPosts(): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } } as never,
      sort: ['-published_at'],
      fields: POST_PARENT_FIELDS,
    })
  )) as unknown as DirectusPostRow[]
  const full = await attachPostTranslations(rows, ['en'])
  return full.map(row => mergePost(row, 'en'))
}

/** Published posts for a given language, ordered by date desc. */
export async function getPostsByLang(lang: string): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } } as never,
      sort: ['-published_at'],
      fields: POST_PARENT_FIELDS,
    })
  )) as unknown as DirectusPostRow[]
  const full = await attachPostTranslations(rows, [lang, 'en'])
  return full.map(row => mergePost(row, lang))
}

/** Paginated published posts for a language. */
export async function getPostsByLangPaginated(
  lang: string,
  page: number,
  perPage: number,
): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } } as never,
      sort: ['-published_at'],
      limit: perPage,
      offset: (page - 1) * perPage,
      fields: POST_PARENT_FIELDS,
    })
  )) as unknown as DirectusPostRow[]
  const full = await attachPostTranslations(rows, [lang, 'en'])
  return full.map(row => mergePost(row, lang))
}

/** Count of published posts. */
export async function getPostsCountByLang(_lang: string): Promise<number> {
  const result = (await directusClient.request(
    aggregate('posts', {
      aggregate: { count: '*' },
      query: { filter: { published_at: { _nnull: true } } },
    })
  )) as unknown as { count: { '*': string } }[]
  return Number(result[0]?.count?.['*']) ?? 0
}

/** Single published post by slug + language (falls back to English). */
export async function getPostBySlugAndLang(
  slug: string,
  lang: string,
): Promise<DirectusPost | null> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { slug: { _eq: slug }, published_at: { _nnull: true } } as never,
      fields: POST_PARENT_FIELDS,
      limit: 1,
    })
  )) as unknown as DirectusPostRow[]
  if (!rows.length) return null
  const full = await attachPostTranslations(rows, [lang, 'en'])
  return mergePost(full[0], lang)
}

/** All language variants of a post (same slug). */
export async function getPostLangVariants(
  slug: string,
): Promise<{ slug: string; language: string }[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { slug: { _eq: slug }, published_at: { _nnull: true } } as never,
      fields: ['id', 'slug'] as never,
      limit: 1,
    })
  )) as unknown as { id: string; slug: string }[]
  if (!rows.length) return []

  const trs = (await directusClient.request(
    readItems('posts_translations', {
      filter: { posts_id: { _eq: rows[0].id } } as never,
      fields: ['languages_code'] as never,
      limit: -1,
    })
  )) as unknown as { languages_code: string }[]

  if (trs.length) {
    return trs.map(tr => ({ slug: rows[0].slug, language: tr.languages_code }))
  }
  return [{ slug: rows[0].slug, language: 'en' }]
}

/** All featured published posts for a language, sorted newest first. */
export async function getFeaturedPosts(lang: string): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true }, featured: { _eq: true } } as never,
      sort: ['-published_at'],
      limit: -1,
      fields: POST_PARENT_FIELDS,
    })
  )) as unknown as DirectusPostRow[]
  const full = await attachPostTranslations(rows, [lang, 'en'])
  return full.map(row => mergePost(row, lang))
}

/** Recent published posts up to a limit. */
export async function getRecentPosts(lang: string, limit = 6): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } } as never,
      sort: ['-published_at'],
      limit,
      fields: POST_PARENT_FIELDS,
    })
  )) as unknown as DirectusPostRow[]
  const full = await attachPostTranslations(rows, [lang, 'en'])
  return full.map(row => mergePost(row, lang))
}

/**
 * All posts for a user (published + drafts), ordered by date desc.
 * Used in the dashboard /posts page.
 */
export async function getMyPosts(authorId: string): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { author_id: { _eq: authorId } } as never,
      sort: ['-date_updated'],
      fields: POST_PARENT_FIELDS,
    })
  )) as unknown as DirectusPostRow[]
  const full = await attachPostTranslations(rows, ['en'])
  return full.map(row => mergePost(row, 'en'))
}

/** Published + draft counts for a user. */
export async function getMyPostsCount(
  authorId: string,
): Promise<{ total: number; published: number }> {
  const [totalResult, publishedResult] = await Promise.all([
    directusClient.request(
      aggregate('posts', {
        aggregate: { count: '*' },
        query: { filter: { author_id: { _eq: authorId } } },
      })
    ),
    directusClient.request(
      aggregate('posts', {
        aggregate: { count: '*' },
        query: { filter: { author_id: { _eq: authorId }, published_at: { _nnull: true } } },
      })
    ),
  ])
  return {
    total:     Number((totalResult as unknown as { count: { '*': string } }[])[0]?.count?.['*']) ?? 0,
    published: Number((publishedResult as unknown as { count: { '*': string } }[])[0]?.count?.['*']) ?? 0,
  }
}

/** Count of published posts for a user (subscription limit check). */
export async function getMyPublishedPostCount(authorId: string): Promise<number> {
  const result = (await directusClient.request(
    aggregate('posts', {
      aggregate: { count: '*' },
      query: { filter: { author_id: { _eq: authorId }, published_at: { _nnull: true } } },
    })
  )) as unknown as { count: { '*': string } }[]
  return Number(result[0]?.count?.['*']) ?? 0
}

/**
 * Ordered list of published post slugs for a language.
 * Used to compute prev/next navigation in post detail pages.
 */
export async function getPostSlugsByLang(lang: string): Promise<string[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } } as never,
      sort: ['-published_at'],
      fields: ['id', 'slug'] as never,
    })
  )) as unknown as { id: string; slug: string }[]

  if (!rows.length) return []
  const ids = rows.map(r => r.id)
  const trs = (await directusClient.request(
    readItems('posts_translations', {
      filter: { posts_id: { _in: ids }, languages_code: { _in: [lang, 'en'] } } as never,
      fields: ['posts_id', 'languages_code'] as never,
      limit: -1,
    })
  )) as unknown as { posts_id: string; languages_code: string }[]

  const trsByPostId = new Map<string, string[]>()
  for (const tr of trs) {
    if (!trsByPostId.has(tr.posts_id)) trsByPostId.set(tr.posts_id, [])
    trsByPostId.get(tr.posts_id)!.push(tr.languages_code)
  }

  return rows
    .filter(r => (trsByPostId.get(r.id) ?? []).includes(lang) || (trsByPostId.get(r.id) ?? []).includes('en'))
    .map(r => r.slug)
}

/** All published post slugs + languages (for generateStaticParams). */
export async function getAllPostSlugs(): Promise<{ slug: string; language: string }[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } } as never,
      fields: ['id', 'slug'] as never,
    })
  )) as unknown as { id: string; slug: string }[]

  if (!rows.length) return []
  const ids = rows.map(r => r.id)
  const trs = (await directusClient.request(
    readItems('posts_translations', {
      filter: { posts_id: { _in: ids } } as never,
      fields: ['posts_id', 'languages_code'] as never,
      limit: -1,
    })
  )) as unknown as { posts_id: string; languages_code: string }[]

  const slugById = new Map(rows.map(r => [r.id, r.slug]))
  if (!trs.length) return rows.map(r => ({ slug: r.slug, language: 'en' }))

  return trs.map(tr => ({ slug: slugById.get(tr.posts_id) ?? '', language: tr.languages_code }))
}

// ─── Pages ────────────────────────────────────────────────────────────────────

/** Fetch a published page by slug + language (falls back to English). */
export async function getPageBySlugAndLang(
  slug: string,
  lang: string,
): Promise<DirectusPage | null> {
  const rows = (await directusClient.request(
    readItems('pages', {
      filter: { slug: { _eq: slug }, status: { _eq: 'published' } } as never,
      fields: PAGE_PARENT_FIELDS,
      limit: 1,
    })
  )) as unknown as DirectusPageRow[]
  if (!rows.length) return null
  const full = await attachPageTranslations(rows, [lang, 'en'])
  return mergePage(full[0], lang)
}

/** All published page slugs + languages (for generateStaticParams). */
export async function getAllPageSlugs(): Promise<{ slug: string; language: string }[]> {
  const rows = (await directusClient.request(
    readItems('pages', {
      filter: { status: { _eq: 'published' } } as never,
      fields: ['id', 'slug'] as never,
    })
  )) as unknown as { id: string; slug: string }[]

  if (!rows.length) return []
  const ids = rows.map(r => r.id)
  const trs = (await directusClient.request(
    readItems('pages_translations', {
      filter: { pages_id: { _in: ids } } as never,
      fields: ['pages_id', 'languages_code'] as never,
      limit: -1,
    })
  )) as unknown as { pages_id: string; languages_code: string }[]

  const slugById = new Map(rows.map(r => [r.id, r.slug]))
  if (!trs.length) return rows.map(r => ({ slug: r.slug, language: 'en' }))

  return trs.map(tr => ({ slug: slugById.get(tr.pages_id) ?? '', language: tr.languages_code }))
}

/** Lightweight nav pages for Navbar construction. */
export async function getNavPages(lang: string): Promise<DirectusNavPage[]> {
  const rows = (await directusClient.request(
    readItems('pages', {
      filter: {
        status: { _eq: 'published' },
        layout: { _in: ['home', 'auth'] },
        slug:   { _neq: 'home' },
      } as never,
      fields: ['id', 'slug', 'access', 'layout'] as never,
    })
  )) as unknown as { id: string; slug: string; access: 'guest' | 'user' | 'admin'; layout: 'home' | 'auth' | 'dashboard' }[]

  if (!rows.length) return []
  const ids = rows.map(r => r.id)
  const trs = (await directusClient.request(
    readItems('pages_translations', {
      filter: { pages_id: { _in: ids }, languages_code: { _in: [lang, 'en'] } } as never,
      fields: ['pages_id', 'languages_code', 'title'] as never,
      limit: -1,
    })
  )) as unknown as { pages_id: string; languages_code: string; title: string }[]

  return rows.map(r => {
    const rowTrs = trs.filter(t => t.pages_id === r.id)
    const tr = rowTrs.find(t => t.languages_code === lang) ?? rowTrs.find(t => t.languages_code === 'en')
    return {
      _id:    r.id,
      title:  tr?.title ?? r.slug,
      slug:   r.slug,
      access: r.access,
      layout: r.layout,
    }
  })
}

// ─── Site config ──────────────────────────────────────────────────────────────

/** Fetch the site-wide config singleton (id = 'site-config'). */
export async function getSiteConfig(lang = 'en'): Promise<DirectusSiteConfig | null> {
  try {
    const row = (await directusClient.request(
      readItem('site_config', 'site-config', { fields: ['*', { translations: ['*'] }] })
    )) as unknown as DirectusSiteConfigRow
    return toSiteConfig(row, lang)
  } catch {
    return null
  }
}
