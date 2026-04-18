/**
 * lib/directus/pageResolver.ts
 *
 * Drop-in replacement for lib/sanity/pageResolver.ts.
 * Exports the same API so route files only need to update their import path.
 */
import 'server-only'
import { getPageBySlugAndLang, getPostBySlugAndLang, getPostLangVariants } from './queries'
import type { DirectusPage, DirectusPost } from '@/types/directus'

// Re-export from lib/seo so existing imports of buildAlternates / buildCanonicalUrl continue to work
export { buildAlternates, buildCanonicalUrl } from '@/lib/seo'

// ─── Language constants ────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'kn'] as const
export type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]

export const LANG_LABELS: Record<SupportedLang, string> = {
  en: 'English',
  hi: 'हिंदी',
  kn: 'ಕನ್ನಡ',
}

export function isSupportedLang(value: string): value is SupportedLang {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

// ─── Content resolution ────────────────────────────────────────────────────────

export interface SlugEntry {
  slug: string
  language: string
}

export type PageResolution =
  | { kind: 'page'; page: DirectusPage }
  | { kind: 'post'; post: DirectusPost; variants: SlugEntry[] }
  | { kind: 'notFound' }

/**
 * Resolves a CMS page or post by slug + language.
 * Mirrors resolveContent() from lib/sanity/pageResolver.ts exactly.
 */
export async function resolveContent(
  slug: string,
  lang: string
): Promise<PageResolution> {
  // 1. Try page first
  const page = await getPageBySlugAndLang(slug, lang)
  if (page) return { kind: 'page', page }

  // 2. Fall back to post
  const post = await getPostBySlugAndLang(slug, lang)
  if (!post) return { kind: 'notFound' }

  // 3. Language variants for the language switcher
  const variants = await getPostLangVariants(slug)

  return { kind: 'post', post, variants }
}
