/**
 * lib/directus/translations.ts
 *
 * Generic helper for resolving the best-available translation from a
 * Directus translations junction array.
 *
 * Used by mergePost() and mergePage() in types/directus.ts, and available
 * for any code that needs to pick translated content with an English fallback.
 */

/**
 * Any object with a `languages_code` field can be used as a translation row.
 */
export type WithLanguageCode = { languages_code: string }

/**
 * Find the translation for `lang`, then fall back to `fallbackLang` (default: 'en'),
 * then return null if neither is present.
 *
 * @example
 * const tr = resolveTranslation(post.translations ?? [], 'hi')
 * const title = tr?.title ?? post.title ?? ''
 */
export function resolveTranslation<T extends WithLanguageCode>(
  translations: T[],
  lang: string,
  fallbackLang = 'en',
): T | null {
  if (!translations.length) return null
  return (
    translations.find((t) => t.languages_code === lang)
    ?? translations.find((t) => t.languages_code === fallbackLang)
    ?? null
  )
}

/**
 * Same as resolveTranslation but returns the `languages_code` of whichever
 * translation was actually resolved. Useful for reporting the effective language
 * to consumers (e.g. for hreflang, for rendering a "translated from EN" badge).
 */
export function resolveTranslationWithLang<T extends WithLanguageCode>(
  translations: T[],
  lang: string,
  fallbackLang = 'en',
): { translation: T; resolvedLang: string } | null {
  const tr = resolveTranslation(translations, lang, fallbackLang)
  if (!tr) return null
  return { translation: tr, resolvedLang: tr.languages_code }
}
