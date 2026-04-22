/**
 * scripts/directus-seed.ts
 *
 * Seeds Directus with the minimum data needed for the ContentFlow demo:
 *  1. languages (en, hi, kn)
 *  2. site_config row (id = "site-config")
 *  3. pages (home, login, signup, posts, analytics, settings, billing, admin)
 *     — parent row + pages_translations rows per language
 *  4. posts (10 sample blog posts)
 *     — parent row + posts_translations rows per language
 *
 * Usage:
 *   npm run directus:seed
 *
 * Required env vars (.env.local):
 *   NEXT_PUBLIC_DIRECTUS_URL  — e.g. http://localhost:8055
 *   DIRECTUS_ADMIN_TOKEN      — static token for a user with admin_access: true
 *
 * Run AFTER:  npm run directus:bootstrap
 *
 * ── Why the token must be admin ─────────────────────────────────────────────
 * In Directus, GET /items/{collection}/{id} returns 403 (not 404) when the
 * requesting user has no read permission on that collection. A user with
 * admin_access: true bypasses all permission checks.
 *
 * ── Why we always request fields[]=id ───────────────────────────────────────
 * The `id` field on both `pages` and `posts` is marked hidden:true in Directus.
 * Without explicitly requesting it, Directus omits it from list responses.
 */

import 'dotenv/config'

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_TOKEN  = process.env.DIRECTUS_ADMIN_TOKEN

if (!ADMIN_TOKEN) {
  console.error('❌  DIRECTUS_ADMIN_TOKEN is not set. Add it to .env.local.')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ADMIN_TOKEN}`,
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function req(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(
      `${method} ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`
    )
  }
  return data as Record<string, unknown>
}

async function reqItem(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { method: 'GET', headers: HEADERS })
  if (res.status === 404 || res.status === 403) return null
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(
      `GET ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`
    )
  }
  return data as Record<string, unknown>
}

async function reqList(path: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { method: 'GET', headers: HEADERS })
  if (res.status === 403) return []
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(
      `GET ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`
    )
  }
  return ((data as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]
}

// ── Admin token validation ────────────────────────────────────────────────────

async function checkAdminAccess(): Promise<void> {
  const res = await fetch(`${DIRECTUS_URL}/users?limit=1&fields[]=id`, { headers: HEADERS })

  if (res.status === 403) {
    const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields[]=email`, { headers: HEADERS })
    const email = meRes.ok
      ? ((await meRes.json()) as { data?: { email?: string } }).data?.email
      : undefined

    console.error('')
    console.error('❌  DIRECTUS_ADMIN_TOKEN does not have admin access')
    if (email) console.error(`    Current token user: ${email}`)
    console.error('')
    console.error('    The token must belong to a user with Administrator role.')
    console.error('    How to get the correct token:')
    console.error('    1. Directus Admin → User Directory')
    console.error('    2. Click your Administrator user → scroll to "Token" field')
    console.error('    3. Click the regenerate icon → copy the new token')
    console.error('    4. Update DIRECTUS_ADMIN_TOKEN in .env.local')
    console.error('    5. Re-run: npm run directus:seed')
    console.error('')
    process.exit(1)
  }

  if (!res.ok) {
    console.warn(`   ⚠  Could not verify admin status (GET /users → ${res.status}). Proceeding.`)
    return
  }

  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields[]=email`, { headers: HEADERS })
  const email = meRes.ok
    ? ((await meRes.json()) as { data?: { email?: string } }).data?.email
    : 'admin user'
  console.log(`   ✓  Token has admin access (${email})`)
}

// ── Schema repair: alias fields + O2M relations ───────────────────────────────
//
// Ensures pages.translations and posts.translations alias fields exist (for the
// Directus admin to display the O2M from the parent's detail view).
//
// Also ensures the O2M relations (pages_translations.pages_id → pages,
// posts_translations.posts_id → posts) exist in directus_relations with
// one_field: 'translations'. Without these, the alias field renders empty
// and the admin can't navigate to translations from the parent.
//
// NOTE: The alias field causes a SQL column bug during PATCH/POST responses
// UNLESS the response is limited to specific fields. The seed uses ?fields[]=id
// on every write to pages/posts, and API routes pass fields: ['id'] to the SDK.

async function ensureAliasFields() {
  console.log('\n🔧  Ensuring alias fields + O2M relations…')

  const ALIAS_PAYLOAD = {
    field: 'translations',
    type:  'alias',
    meta: {
      special:         ['o2m'],
      interface:       'list-o2m',
      options:         { enableCreate: true, enableSelect: false },
      display:         'related-values',
      display_options: { template: '{{languages_code}}: {{title}}' },
      readonly:        false,
      hidden:          false,
      width:           'full',
    },
    schema: null,
  }

  for (const collection of ['posts', 'pages'] as const) {
    const check = await fetch(`${DIRECTUS_URL}/fields/${collection}/translations`, { headers: HEADERS })
    if (check.status === 404) {
      const res = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify(ALIAS_PAYLOAD),
      })
      if (res.ok) console.log(`   ✓  Created alias field: ${collection}.translations`)
      else { const t = await res.text(); console.warn(`   ⚠  POST /fields/${collection} → ${res.status}: ${t.slice(0, 120)}`) }
    } else {
      console.log(`   ✓  Alias field exists: ${collection}.translations`)
    }
  }

  // Ensure O2M relations exist in directus_relations
  for (const { many, fk, one, oneFk } of [
    { many: 'pages_translations', fk: 'pages_id', one: 'pages',  oneFk: 'id' },
    { many: 'posts_translations', fk: 'posts_id', one: 'posts',  oneFk: 'id' },
    { many: 'pages_translations', fk: 'languages_code', one: 'languages', oneFk: 'code' },
    { many: 'posts_translations', fk: 'languages_code', one: 'languages', oneFk: 'code' },
  ]) {
    const check = await fetch(
      `${DIRECTUS_URL}/relations/${many}/${fk}`,
      { headers: HEADERS }
    )
    if (check.status === 403 || check.status === 404) {
      const isTranslations = fk.endsWith('_id')
      const body: Record<string, unknown> = {
        collection: many, field: fk, related_collection: one,
        meta: {
          many_collection: many, many_field: fk,
          one_collection: one,
          one_field: isTranslations ? 'translations' : null,
          one_deselect_action: 'nullify', sort_field: null,
        },
        schema: {
          table: many, column: fk,
          foreign_key_table: one, foreign_key_column: oneFk,
          on_update: 'NO ACTION', on_delete: 'CASCADE',
        },
      }
      const res = await fetch(`${DIRECTUS_URL}/relations`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(body),
      })
      if (res.ok) console.log(`   ✓  Created relation: ${many}.${fk} → ${one}.${oneFk}`)
      else { const t = await res.text(); console.warn(`   ⚠  POST /relations ${many}.${fk} → ${res.status}: ${t.slice(0, 120)}`) }
    } else {
      console.log(`   ✓  Relation exists: ${many}.${fk}`)
    }
  }
}

// ── languages ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', name: 'English',  direction: 'ltr' },
  { code: 'hi', name: 'Hindi',    direction: 'ltr' },
  { code: 'kn', name: 'Kannada',  direction: 'ltr' },
] as const

async function seedLanguages() {
  console.log('\n🌐  Seeding languages…')
  for (const lang of LANGUAGES) {
    const existing = await reqItem(`/items/languages/${lang.code}`)
    if (existing?.data) {
      await req('PATCH', `/items/languages/${lang.code}`, { name: lang.name, direction: lang.direction })
      console.log(`   ✓  Updated language: ${lang.code} (${lang.name})`)
    } else {
      await req('POST', '/items/languages', lang)
      console.log(`   ✓  Created language: ${lang.code} (${lang.name})`)
    }
  }
}

// ── site_config ───────────────────────────────────────────────────────────────

async function upsertSiteConfig() {
  console.log('\n📋  Seeding site_config…')

  const { default: config } = await import('./seed-data/site-config.json', { with: { type: 'json' } })

  const existing = await reqItem('/items/site_config/site-config')

  if (existing?.data) {
    const { id: _id, ...updatePayload } = config as Record<string, unknown>
    void _id
    await req('PATCH', '/items/site_config/site-config', updatePayload)
    console.log('   ✓  Updated site-config row')
  } else {
    await req('POST', '/items/site_config', { ...config, id: 'site-config' })
    console.log('   ✓  Created site-config row (id = "site-config")')
  }
}

// ── pages ─────────────────────────────────────────────────────────────────────
//
// Pages seed-data format (pages.json):
//   { slug, status, access, layout, og_image, translations: [{ languages_code, title, sections, seo_title, seo_description }] }
//
// Strategy:
//  1. Upsert the parent page row (slug is the natural key).
//  2. For each translation, upsert the pages_translations row (pages_id + languages_code).
//
// IMPORTANT: slug excluded from PATCH payload — Directus crashes with a 500 when
// you PATCH a unique field with its existing value (internal uniqueness-check bug).

const PAGES_PARENT_POST_FIELDS = new Set(['slug', 'status', 'access', 'layout', 'og_image'])
const PAGES_PARENT_PATCH_FIELDS = new Set(['status', 'access', 'layout', 'og_image'])
const PAGES_TR_POST_FIELDS  = new Set(['pages_id', 'languages_code', 'title', 'sections', 'seo_title', 'seo_description'])
const PAGES_TR_PATCH_FIELDS = new Set(['title', 'sections', 'seo_title', 'seo_description'])

function pickFields(obj: Record<string, unknown>, allowed: Set<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => allowed.has(k)))
}

async function seedPages() {
  console.log('\n📄  Seeding pages…')

  const { default: pages } = await import('./seed-data/pages.json', { with: { type: 'json' } })

  for (const page of pages as Record<string, unknown>[]) {
    const slug = page.slug as string
    const translations = (page.translations as Record<string, unknown>[]) ?? []

    // ── 1. Upsert parent ──────────────────────────────────────────────────────
    const parentRows = await reqList(
      `/items/pages?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1&fields[]=id&fields[]=slug`
    )

    let parentId: string
    if (parentRows.length) {
      parentId = parentRows[0].id as string
      if (!parentId) {
        console.warn(`   ⚠  Page "${slug}" found but id missing — skipping`)
        continue
      }
      await req('PATCH', `/items/pages/${parentId}?fields[]=id`, pickFields(page, PAGES_PARENT_PATCH_FIELDS))
      console.log(`   ✓  Updated page parent: ${slug}`)
    } else {
      // ?fields[]=id prevents Directus from SELECTing the `translations` alias field
      // in the response, which would cause a "column pages.translations does not exist" error.
      const created = await req('POST', '/items/pages?fields[]=id', pickFields(page, PAGES_PARENT_POST_FIELDS))
      parentId = ((created as { data?: { id?: string } }).data?.id ?? (created as { id?: string }).id) as string
      console.log(`   ✓  Created page parent: ${slug} (id=${parentId})`)
    }

    // ── 2. Upsert translations ────────────────────────────────────────────────
    for (const tr of translations) {
      const lang = tr.languages_code as string

      const trRows = await reqList(
        `/items/pages_translations?filter[pages_id][_eq]=${encodeURIComponent(parentId)}&filter[languages_code][_eq]=${lang}&limit=1&fields[]=id`
      )

      if (trRows.length) {
        const trId = trRows[0].id as string | number
        if (!trId) {
          console.warn(`   ⚠  Translation "${slug}" (${lang}) found but id missing — skipping update`)
          continue
        }
        await req('PATCH', `/items/pages_translations/${trId}?fields[]=id`, pickFields(tr, PAGES_TR_PATCH_FIELDS))
        console.log(`      ✓  Updated translation: ${slug} [${lang}]`)
      } else {
        await req('POST', '/items/pages_translations?fields[]=id', pickFields({ ...tr, pages_id: parentId }, PAGES_TR_POST_FIELDS))
        console.log(`      ✓  Created translation: ${slug} [${lang}]`)
      }
    }
  }
}

// ── posts ─────────────────────────────────────────────────────────────────────
//
// Posts seed-data format (posts.json):
//   { slug, cover_image, published_at, featured, tags, author_*, translations: [{ languages_code, title, excerpt, body, seo_title, seo_description }] }
//
// Strategy: same as pages — upsert parent, then upsert each translation row.

const POSTS_PARENT_POST_FIELDS  = new Set(['slug', 'cover_image', 'published_at', 'featured', 'tags', 'author_id', 'author_name', 'author_email', 'author_avatar'])
const POSTS_PARENT_PATCH_FIELDS = new Set(['cover_image', 'published_at', 'featured', 'tags', 'author_id', 'author_name', 'author_email', 'author_avatar'])
const POSTS_TR_POST_FIELDS  = new Set(['posts_id', 'languages_code', 'title', 'excerpt', 'body', 'seo_title', 'seo_description'])
const POSTS_TR_PATCH_FIELDS = new Set(['title', 'excerpt', 'body', 'seo_title', 'seo_description'])

async function seedPosts() {
  console.log('\n📝  Seeding posts…')

  const { default: posts } = await import('./seed-data/posts.json', { with: { type: 'json' } })

  for (const post of posts as Record<string, unknown>[]) {
    const slug = post.slug as string
    const translations = (post.translations as Record<string, unknown>[]) ?? []

    // ── 1. Upsert parent ──────────────────────────────────────────────────────
    const parentRows = await reqList(
      `/items/posts?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1&fields[]=id&fields[]=slug`
    )

    let parentId: string
    if (parentRows.length) {
      parentId = parentRows[0].id as string
      if (!parentId) {
        console.warn(`   ⚠  Post "${slug}" found but id missing — skipping`)
        continue
      }
      await req('PATCH', `/items/posts/${parentId}?fields[]=id`, pickFields(post, POSTS_PARENT_PATCH_FIELDS))
      console.log(`   ✓  Updated post parent: ${slug}`)
    } else {
      // ?fields[]=id prevents Directus from SELECTing the `translations` alias field in the response
      const created = await req('POST', '/items/posts?fields[]=id', pickFields(post, POSTS_PARENT_POST_FIELDS))
      parentId = ((created as { data?: { id?: string } }).data?.id ?? (created as { id?: string }).id) as string
      console.log(`   ✓  Created post parent: ${slug} (id=${parentId})`)
    }

    // ── 2. Upsert translations ────────────────────────────────────────────────
    for (const tr of translations) {
      const lang = tr.languages_code as string

      const trRows = await reqList(
        `/items/posts_translations?filter[posts_id][_eq]=${encodeURIComponent(parentId)}&filter[languages_code][_eq]=${lang}&limit=1&fields[]=id`
      )

      if (trRows.length) {
        const trId = trRows[0].id as string | number
        if (!trId) {
          console.warn(`   ⚠  Translation "${slug}" (${lang}) found but id missing — skipping update`)
          continue
        }
        await req('PATCH', `/items/posts_translations/${trId}?fields[]=id`, pickFields(tr, POSTS_TR_PATCH_FIELDS))
        console.log(`      ✓  Updated translation: ${slug} [${lang}]`)
      } else {
        await req('POST', '/items/posts_translations?fields[]=id', pickFields({ ...tr, posts_id: parentId }, POSTS_TR_POST_FIELDS))
        console.log(`      ✓  Created translation: ${slug} [${lang}]`)
      }
    }
  }
}

// ── Public token permissions ──────────────────────────────────────────────────
//
// The public read token needs READ permission on posts_translations,
// pages_translations, and languages so the two-query translation approach works.
// Without this, Directus silently returns [] for those collections, causing
// every page/post to render with empty titles on hi/kn routes.

async function ensurePublicTokenPermissions() {
  console.log('\n🔑  Ensuring public token read permissions…')

  const publicToken = process.env.NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN
  if (!publicToken) {
    console.warn('   ⚠  NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN not set — skipping')
    return
  }

  // Look up which role the public token belongs to
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields[]=role`, {
    headers: { Authorization: `Bearer ${publicToken}` },
  })
  if (!meRes.ok) {
    console.warn(`   ⚠  Could not look up public token user (${meRes.status}) — skipping`)
    return
  }
  const meData = (await meRes.json()) as { data?: { role?: string } }
  const roleId = meData?.data?.role
  if (!roleId) {
    console.warn('   ⚠  Public token user has no role — skipping')
    return
  }

  const NEEDED: { collection: string; fields: string }[] = [
    { collection: 'posts_translations', fields: '*' },
    { collection: 'pages_translations', fields: '*' },
    { collection: 'languages',          fields: '*' },
  ]

  for (const { collection, fields } of NEEDED) {
    const existing = await reqList(
      `/permissions?filter[role][_eq]=${roleId}&filter[collection][_eq]=${collection}&filter[action][_eq]=read&limit=1`
    )
    if (existing.length === 0) {
      try {
        await req('POST', '/permissions', {
          role: roleId,
          collection,
          action: 'read',
          fields,
          permissions: {},
          validation: {},
        })
        console.log(`   ✓  Granted read: ${collection}`)
      } catch (e) {
        console.warn(`   ⚠  Could not grant read on ${collection}: ${(e as Error).message}`)
      }
    } else {
      // Ensure fields is '*' not a restricted subset
      const existing0 = existing[0] as { id?: number; fields?: string }
      if (existing0.fields && existing0.fields !== '*') {
        try {
          await req('PATCH', `/permissions/${existing0.id}`, { fields })
          console.log(`   ✓  Updated fields to '*': ${collection}`)
        } catch {
          console.warn(`   ⚠  Could not update fields on permission for ${collection}`)
        }
      } else {
        console.log(`   ✓  Read permission OK: ${collection}`)
      }
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀  ContentFlow → Directus seed`)
  console.log(`    URL: ${DIRECTUS_URL}`)

  try {
    await req('GET', '/collections')
    console.log('   ✓  Directus reachable')
  } catch (err) {
    console.error('❌  Cannot reach Directus. Check NEXT_PUBLIC_DIRECTUS_URL in .env.local')
    console.error('   ', (err as Error).message)
    process.exit(1)
  }

  await checkAdminAccess()

  await ensureAliasFields()
  await ensurePublicTokenPermissions()
  await seedLanguages()
  await upsertSiteConfig()
  await seedPages()
  await seedPosts()

  console.log('\n✅  Seed complete!\n')
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})
