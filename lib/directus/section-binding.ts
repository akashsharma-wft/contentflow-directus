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

/** Binding for a posts_translations field. translationId is the integer row ID. */
export function postAttr(translationId: number | undefined | null, field: string): string {
  return editableAttr({
    collection: 'posts_translations',
    item: translationId ?? null,
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