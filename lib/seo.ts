/**
 * lib/seo.ts
 *
 * Centralised SEO utilities for ContentFlow.
 * Produces Next.js Metadata objects with proper canonical URLs,
 * hreflang alternates, and OpenGraph tags.
 *
 * URL conventions:
 *   English  → /slug  (no prefix)        canonical: /slug
 *   Hindi    → /hi/slug                   canonical: /hi/slug
 *   Kannada  → /kn/slug                   canonical: /kn/slug
 *   Homepage → /  /hi  /kn
 */
import type { Metadata } from 'next'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const SITE_NAME = 'ContentFlow'
const DEFAULT_TITLE = 'ContentFlow — Modern CMS Platform'
const DEFAULT_DESCRIPTION = 'CMS-driven publishing platform for engineering teams. API-first, high-performance content delivery.'

// ─── URL builders ──────────────────────────────────────────────────────────────

/** Returns the canonical path (no origin) for a given slug + lang. */
export function buildCanonicalPath(slug: string, lang: string): string {
  const isHome = slug === 'home'
  if (lang === 'en') return isHome ? '/' : `/${slug}`
  return isHome ? `/${lang}` : `/${lang}/${slug}`
}

/** Returns absolute canonical URL. */
export function buildCanonicalUrl(slug: string, lang: string): string {
  return `${APP_URL}${buildCanonicalPath(slug, lang)}`
}

/** Returns hreflang alternates map (paths, not absolute URLs — Next.js adds the base). */
export function buildHreflangPaths(slug: string): Record<string, string> {
  const isHome = slug === 'home'
  const enPath  = isHome ? '/' : `/${slug}`
  const hiPath  = isHome ? '/hi' : `/hi/${slug}`
  const knPath  = isHome ? '/kn' : `/kn/${slug}`
  return {
    'x-default': enPath,
    en: enPath,
    hi: hiPath,
    kn: knPath,
  }
}

// ─── Main builder ──────────────────────────────────────────────────────────────

export interface SeoInput {
  /** Page slug (e.g. 'home', 'about', 'my-post') */
  slug: string
  /** Active language code: 'en' | 'hi' | 'kn' */
  lang: string
  /** Page/post title — falls back to SITE_NAME */
  title?: string | null
  /** Page/post description — falls back to DEFAULT_DESCRIPTION */
  description?: string | null
  /** Resolved OG image URL */
  ogImage?: string | null
}

export function buildMetadata({
  slug,
  lang,
  title,
  description,
  ogImage,
}: SeoInput): Metadata {
  const resolvedTitle       = title ?? DEFAULT_TITLE
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION
  const canonicalPath       = buildCanonicalPath(slug, lang)
  const canonicalUrl        = buildCanonicalUrl(slug, lang)
  const hreflangPaths       = buildHreflangPaths(slug)

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: canonicalPath,
      languages: hreflangPaths,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: resolvedTitle,
      description: resolvedDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

// ─── Convenience re-export (keeps pageResolver.ts usage compatible) ────────────

/**
 * Drop-in replacement for the old buildAlternates() used across route files.
 * Returns the shape expected by Next.js Metadata.alternates.
 */
export function buildAlternates(slug: string) {
  const canonical = buildCanonicalPath(slug, 'en')
  return {
    canonical,
    languages: buildHreflangPaths(slug),
  }
}
