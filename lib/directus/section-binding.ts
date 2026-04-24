/**
 * lib/directus/section-binding.ts
 *
 * Tiny helper that every section component uses to create data-directus
 * attribute values for individual Directus fields.
 *
 * Usage in any section component:
 *
 *   import { pageAttr, siteAttr } from '@/lib/directus/section-binding'
 *
 *   // Bind to a pages_translations field:
 *   <h1 data-directus={pageAttr(translationId, 'hero_heading')}>
 *
 *   // Bind to a site_config field:
 *   <span data-directus={siteAttr('navbar_brand_name')}>
 *
 *   // Bind to a posts_translations field:
 *   <h1 data-directus={postAttr(translationId, 'title')}>
 */

import { editableAttr } from '@/lib/directus/visual-editing'

/** Binding for a pages_translations field. translationId is the integer row ID. */
export function pageAttr(translationId: number | undefined | null, field: string): string {
  return editableAttr({
    collection: 'pages_translations',
    item: translationId ?? null,
    fields: field,
    mode: 'drawer',
  })
}

/**
 * Binding for MULTIPLE pages_translations fields shown together in one drawer.
 * Use this on elements like links where you want both label and href editable
 * when the editor clicks: pageAttrs(id, 'featured_posts_view_all', 'featured_posts_view_all_href')
 */
export function pageAttrs(translationId: number | undefined | null, ...fields: string[]): string {
  return editableAttr({
    collection: 'pages_translations',
    item: translationId ?? null,
    fields: fields.join(','),
    mode: 'drawer',
  })
}

/** Binding for a posts_translations field. translationId is the integer row ID. */
export function postAttr(translationId: number | undefined | null, field: string): string {
  return editableAttr({
    collection: 'posts_translations',
    item: translationId ?? null,
    fields: field,
    mode: 'drawer',
  })
}

/** Binding for MULTIPLE posts_translations fields shown together in one drawer. */
export function postAttrs(translationId: number | undefined | null, ...fields: string[]): string {
  return editableAttr({
    collection: 'posts_translations',
    item: translationId ?? null,
    fields: fields.join(','),
    mode: 'drawer',
  })
}

/**
 * Binding for a field on the posts PARENT collection (not the translation).
 * Use for fields like cover_image, featured, tags, published_at which live
 * on the posts row, not posts_translations.
 */
export function postParentAttr(postId: string | undefined | null, field: string): string {
  return editableAttr({
    collection: 'posts',
    item: postId ?? null,
    fields: field,
    mode: 'drawer',
  })
}

/** Binding for a site_config field. Always uses item 'site-config'. */
export function siteAttr(field: string): string {
  return editableAttr({
    collection: 'site_config',
    item: 'site-config',
    fields: field,
    mode: 'drawer',
  })
}

/** Binding for MULTIPLE site_config fields in one drawer (e.g. label + href). */
export function siteAttrs(...fields: string[]): string {
  return editableAttr({
    collection: 'site_config',
    item: 'site-config',
    fields: fields.join(','),
    mode: 'drawer',
  })
}

/** Binding for a site_config_translations field (translatable labels). */
export function siteTranslationAttr(translationId: number | undefined | null, field: string): string {
  return editableAttr({
    collection: 'site_config_translations',
    item: translationId ?? null,
    fields: field,
    mode: 'drawer',
  })
}

/** Binding for MULTIPLE site_config_translations fields in one drawer. */
export function siteTranslationAttrs(translationId: number | undefined | null, ...fields: string[]): string {
  return editableAttr({
    collection: 'site_config_translations',
    item: translationId ?? null,
    fields: fields.join(','),
    mode: 'drawer',
  })
}