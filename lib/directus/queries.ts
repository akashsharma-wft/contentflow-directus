/**
 * lib/directus/queries.ts
 *
 * All CMS read functions — replaces lib/sanity/queries.ts + the fetch calls
 * scattered across page server components.
 *
 * Each function returns the same normalised type that Sanity queries returned,
 * so consumers need only change the import path, not the usage.
 *
 * Note: We use `as unknown as T` casts because the Directus SDK v21 generics
 * return a narrow inferred type when `fields` is specified. At runtime the data
 * is exactly what we declare, so the casts are safe.
 */
import 'server-only'
import {
  readItems,
  readItem,
  aggregate,
} from '@directus/sdk'
import { directusClient } from './client'
import {
  toPost,
  toPage,
  toSiteConfig,
  type DirectusPost,
  type DirectusPage,
  type DirectusSiteConfig,
  type DirectusNavPage,
  type DirectusPostRow,
  type DirectusPageRow,
  type DirectusSiteConfigRow,
} from '@/types/directus'

// ─── Posts ────────────────────────────────────────────────────────────────────

/** All published posts (all languages), ordered by date desc. */
export async function getAllPosts(): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } },
      sort: ['-published_at'],
    })
  )) as unknown as DirectusPostRow[]
  return rows.map(toPost)
}

/** Published posts for a given language. Params: lang */
export async function getPostsByLang(lang: string): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: {
        language:     { _eq: lang },
        published_at: { _nnull: true },
      },
      sort: ['-published_at'],
    })
  )) as unknown as DirectusPostRow[]
  return rows.map(toPost)
}

/** Paginated published posts for a language. */
export async function getPostsByLangPaginated(
  lang: string,
  page: number,
  perPage: number
): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: {
        language:     { _eq: lang },
        published_at: { _nnull: true },
      },
      sort: ['-published_at'],
      limit:  perPage,
      offset: (page - 1) * perPage,
    })
  )) as unknown as DirectusPostRow[]
  return rows.map(toPost)
}

/** Count of published posts for a language. */
export async function getPostsCountByLang(lang: string): Promise<number> {
  const result = (await directusClient.request(
    aggregate('posts', {
      aggregate: { count: '*' },
      query: { filter: { language: { _eq: lang }, published_at: { _nnull: true } } },
    })
  )) as unknown as { count: { '*': string } }[]
  return Number(result[0]?.count?.['*']) ?? 0
}

/** Single published post by slug + language (falls back to English if not found). */
export async function getPostBySlugAndLang(
  slug: string,
  lang: string
): Promise<DirectusPost | null> {
  let rows = (await directusClient.request(
    readItems('posts', {
      filter: {
        slug:         { _eq: slug },
        language:     { _eq: lang },
        published_at: { _nnull: true },
      },
      limit: 1,
    })
  )) as unknown as DirectusPostRow[]

  // Fall back to English
  if (!rows.length && lang !== 'en') {
    rows = (await directusClient.request(
      readItems('posts', {
        filter: {
          slug:         { _eq: slug },
          language:     { _eq: 'en' },
          published_at: { _nnull: true },
        },
        limit: 1,
      })
    )) as unknown as DirectusPostRow[]
  }

  return rows.length ? toPost(rows[0]) : null
}

/** All language variants of a post (same slug, different language). */
export async function getPostLangVariants(
  slug: string
): Promise<{ slug: string; language: string }[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: {
        slug:         { _eq: slug },
        published_at: { _nnull: true },
      },
      fields: ['slug', 'language'] as never,
    })
  )) as unknown as { slug: string; language: string }[]
  return rows
}

/** Featured published posts up to a limit, for a language. */
export async function getFeaturedPosts(
  lang: string,
  limit = 3
): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: {
        language:     { _eq: lang },
        published_at: { _nnull: true },
        featured:     { _eq: true },
      },
      sort: ['-published_at'],
      limit,
    })
  )) as unknown as DirectusPostRow[]
  return rows.map(toPost)
}

/** Recent published posts up to a limit, for a language. */
export async function getRecentPosts(
  lang: string,
  limit = 6
): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: {
        language:     { _eq: lang },
        published_at: { _nnull: true },
      },
      sort: ['-published_at'],
      limit,
    })
  )) as unknown as DirectusPostRow[]
  return rows.map(toPost)
}

/**
 * All posts for a user (published + drafts), ordered by date desc.
 * Used in the dashboard /posts page.
 */
export async function getMyPosts(authorId: string): Promise<DirectusPost[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { author_id: { _eq: authorId } },
      sort: ['-date_updated'],
    })
  )) as unknown as DirectusPostRow[]
  return rows.map(toPost)
}

/** Published + draft counts for a user. */
export async function getMyPostsCount(
  authorId: string
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
      filter: {
        language:     { _eq: lang },
        published_at: { _nnull: true },
      },
      sort:   ['-published_at'],
      fields: ['slug'] as never,
    })
  )) as unknown as { slug: string }[]
  return rows.map(r => r.slug)
}

/** All published post slugs + languages (for generateStaticParams). */
export async function getAllPostSlugs(): Promise<{ slug: string; language: string }[]> {
  const rows = (await directusClient.request(
    readItems('posts', {
      filter: { published_at: { _nnull: true } },
      fields: ['slug', 'language'] as never,
    })
  )) as unknown as { slug: string; language: string }[]
  return rows
}

// ─── Pages ────────────────────────────────────────────────────────────────────

/** Fetch a published page by slug + language (falls back to English). */
export async function getPageBySlugAndLang(
  slug: string,
  lang: string
): Promise<DirectusPage | null> {
  let rows = (await directusClient.request(
    readItems('pages', {
      filter: {
        slug:     { _eq: slug },
        language: { _eq: lang },
        status:   { _eq: 'published' },
      },
      limit: 1,
    })
  )) as unknown as DirectusPageRow[]

  if (!rows.length && lang !== 'en') {
    rows = (await directusClient.request(
      readItems('pages', {
        filter: {
          slug:     { _eq: slug },
          language: { _eq: 'en' },
          status:   { _eq: 'published' },
        },
        limit: 1,
      })
    )) as unknown as DirectusPageRow[]
  }

  return rows.length ? toPage(rows[0]) : null
}

/** All published page slugs + languages (for generateStaticParams). */
export async function getAllPageSlugs(): Promise<{ slug: string; language: string }[]> {
  const rows = (await directusClient.request(
    readItems('pages', {
      filter: { status: { _eq: 'published' } },
      fields: ['slug', 'language'] as never,
    })
  )) as unknown as { slug: string; language: string }[]
  return rows
}

/** Lightweight nav pages for Navbar construction (layout = home or auth, not the home slug). */
export async function getNavPages(lang: string): Promise<DirectusNavPage[]> {
  const rows = (await directusClient.request(
    readItems('pages', {
      filter: {
        status:   { _eq: 'published' },
        language: { _eq: lang },
        layout:   { _in: ['home', 'auth'] },
        slug:     { _neq: 'home' },
      },
      fields: ['id', 'title', 'slug', 'access', 'layout'] as never,
    })
  )) as unknown as Pick<DirectusPageRow, 'id' | 'title' | 'slug' | 'access' | 'layout'>[]
  return rows.map(r => ({
    _id:    r.id,
    title:  r.title,
    slug:   r.slug,
    access: r.access,
    layout: r.layout,
  }))
}

// ─── Site config ──────────────────────────────────────────────────────────────

/** Fetch the site-wide config singleton (id = 'site-config'). */
export async function getSiteConfig(): Promise<DirectusSiteConfig | null> {
  try {
    const row = (await directusClient.request(
      readItem('site_config', 'site-config')
    )) as unknown as DirectusSiteConfigRow
    return toSiteConfig(row)
  } catch {
    return null
  }
}
