/**
 * lib/directus/visual-editing.ts
 *
 * SSR-safe helper for building `data-directus` attribute values.
 * Replicates the format that @directus/visual-editing apply() reads
 * without importing the browser-only visual-editing bundle into server
 * components (which would pull in @reach/observe-rect and crash SSR).
 *
 * Usage (server or client component):
 *   <h1 data-directus={editableAttr({ collection: 'posts_translations', item: id, fields: 'title' })}>
 *
 * The bridge (VisualEditingBridge.tsx) calls apply() on the client once
 * ?visual-editing=true is present, which reads these attributes and
 * overlays the edit UI.
 */

type EditMode = 'drawer' | 'modal' | 'popover'

export interface EditableConfig {
  collection: string
  item: string | number | null
  fields?: string | string[]
  mode?: EditMode
}

/** Returns the value for the `data-directus` attribute. */
export function editableAttr(config: EditableConfig): string {
  const parts: string[] = [`collection:${config.collection}`]

  if (config.item !== null && config.item !== undefined) {
    parts.push(`item:${config.item}`)
  }

  if (config.fields) {
    const f = Array.isArray(config.fields)
      ? config.fields.join(',')
      : config.fields
    parts.push(`fields:${f}`)
  }

  parts.push(`mode:${config.mode ?? 'drawer'}`)

  return parts.join(';')
}
