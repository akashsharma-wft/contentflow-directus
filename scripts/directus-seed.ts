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

// site_config has a `translations` alias field. Directus always runs a SELECT after
// PATCH/POST to return the updated item, and that SELECT incorrectly includes `translations`
// as a real column — causing a 500 even though the DB write succeeded. We use raw fetch
// here so we can detect that specific error and treat the write as successful.
async function siteConfigWrite(method: 'PATCH' | 'POST', path: string, body: unknown): Promise<void> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  if (res.ok) return
  const text = await res.text()
  // The DB write succeeds but the response SELECT fails because Directus tries to
  // SELECT the `translations` alias as a real column. Swallow that specific error.
  if (res.status === 500 && text.includes('site_config.translations does not exist')) return
  throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
}

async function upsertSiteConfig() {
  console.log('\n📋  Seeding site_config…')

  const { default: config } = await import('./seed-data/site-config.json', { with: { type: 'json' } })

  const existing = await reqItem('/items/site_config/site-config?fields[]=id')

  if (existing?.data) {
    const { id: _id, ...updatePayload } = config as Record<string, unknown>
    void _id
    await siteConfigWrite('PATCH', '/items/site_config/site-config', updatePayload)
    console.log('   ✓  Updated site-config row')
  } else {
    await siteConfigWrite('POST', '/items/site_config', { ...config, id: 'site-config' })
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
const PAGES_TR_POST_FIELDS  = new Set(['pages_id', 'languages_code', 'title', 'sections', 'seo_title', 'seo_description', 'page_slug'])
const PAGES_TR_PATCH_FIELDS = new Set(['title', 'sections', 'seo_title', 'seo_description', 'page_slug'])

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
        await req('PATCH', `/items/pages_translations/${trId}?fields[]=id`, pickFields({ ...tr, page_slug: slug }, PAGES_TR_PATCH_FIELDS))
        console.log(`      ✓  Updated translation: ${slug} [${lang}]`)
      } else {
        await req('POST', '/items/pages_translations?fields[]=id', pickFields({ ...tr, pages_id: parentId, page_slug: slug }, PAGES_TR_POST_FIELDS))
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

// ── Extract individual content fields from sections JSON ──────────────────────
//
// After pages are seeded (sections JSON populated), this step reads back each
// pages_translations row and extracts every content string into its individual
// flat field (hero_heading, billing_heading, etc.).
//
// This means a fresh bootstrap+seed gives a fully editor-friendly Directus
// without needing to run the separate migrate script.

function s(val: unknown): string | null {
  if (val === null || val === undefined) return null
  return String(val)
}

async function extractPageContentFields() {
  console.log('\n🔄  Extracting individual content fields from sections JSON…')

  const res = await fetch(`${DIRECTUS_URL}/items/pages_translations?limit=200&fields=*`, { headers: HEADERS })
  if (!res.ok) { console.warn('   ⚠  Could not fetch pages_translations — skipping'); return }
  const rows = ((await res.json()) as { data: Array<Record<string, unknown>> }).data ?? []
  console.log(`   Found ${rows.length} translation rows`)

  let migrated = 0
  for (const row of rows) {
    const id = row.id as number
    const sections = (row.sections as unknown[]) ?? []
    const update: Record<string, string | null> = {}

    for (const section of sections) {
      const s_ = section as Record<string, unknown>
      const type = (s_.sectionType ?? s_._type) as string

      if (type === 'hero' || type === 'heroSection') {
        const d = (s_.hero ?? s_) as Record<string, unknown>
        const pc = d.primaryCta   as Record<string, unknown> | undefined
        const sc = d.secondaryCta as Record<string, unknown> | undefined
        update.hero_heading             = s(d.heading)
        update.hero_subheading          = s(d.subheading)
        update.hero_badge               = s(d.badge)
        update.hero_community_text      = s(d.communityText)
        update.hero_primary_cta_label   = s(pc?.label)
        update.hero_primary_cta_href    = s(pc?.href)
        update.hero_secondary_cta_label = s(sc?.label)
        update.hero_secondary_cta_href  = s(sc?.href)
      }
      if (type === 'featuredPosts' || type === 'featuredPostsSection') {
        const d = (s_.featuredPosts ?? s_) as Record<string, unknown>
        update.featured_posts_heading      = s(d.heading)
        update.featured_posts_subheading   = s(d.subheading)
        update.featured_posts_view_all     = s(d.viewAllLabel)
        update.featured_posts_view_all_href = s(d.viewAllHref) ?? '/posts'
      }
      if (type === 'recentPosts' || type === 'recentPostsSection') {
        const d = (s_.recentPosts ?? s_) as Record<string, unknown>
        update.recent_posts_heading      = s(d.heading)
        update.recent_posts_subheading   = s(d.subheading)
        update.recent_posts_view_all     = s(d.viewAllLabel)
        update.recent_posts_view_all_href = s(d.viewAllHref) ?? '/posts'
      }
      if (type === 'cta' || type === 'ctaSection') {
        const d = (s_.cta ?? s_) as Record<string, unknown>
        const pb = d.primaryButton as Record<string, unknown> | undefined
        update.cta_heading       = s(d.heading)
        update.cta_body          = s(d.body)
        update.cta_primary_label = s(pb?.label)
        update.cta_primary_href  = s(pb?.href)
      }
      if (type === 'authHero') {
        const d = (s_.authHero ?? s_) as Record<string, unknown>
        update.auth_hero_badge       = s(d.badge)
        update.auth_hero_headline    = s(d.headline)
        update.auth_hero_footer_note = s(d.footerNote)
      }
      if (type === 'authForm' || type === 'authSection') {
        const d = (s_.authForm ?? s_) as Record<string, unknown>
        update.auth_heading              = s(d.heading)
        update.auth_google_label         = s(d.googleLabel)
        update.auth_divider_label        = s(d.dividerLabel)
        update.auth_name_label           = s(d.nameLabel)
        update.auth_name_placeholder     = s(d.namePlaceholder)
        update.auth_email_label          = s(d.emailLabel)
        update.auth_email_placeholder    = s(d.emailPlaceholder)
        update.auth_password_label       = s(d.passwordLabel)
        update.auth_password_placeholder = s(d.passwordPlaceholder)
        update.auth_submit_label         = s(d.submitLabel)
        update.auth_footer_text          = s(d.footerText)
        update.auth_footer_link_label    = s(d.footerLinkLabel)
        update.auth_footer_link_href     = s(d.footerLinkHref)
      }
      if (type === 'postsHeader') {
        const d = (s_.postsHeader ?? s_) as Record<string, unknown>
        update.posts_heading    = s(d.heading)
        update.posts_subheading = s(d.subheading)
        update.posts_api_badge  = s(d.apiBadgeLabel)
      }
      if (type === 'postsStats') {
        const d = (s_.postsStats ?? s_) as Record<string, unknown>
        update.posts_my_label        = s(d.myPostsLabel)
        update.posts_published_label = s(d.publishedLabel)
        update.posts_drafts_label    = s(d.draftsLabel)
      }
      if (type === 'postsActions') {
        const d = (s_.postsActions ?? s_) as Record<string, unknown>
        update.posts_sync_label = s(d.syncButtonLabel)
        update.posts_new_label  = s(d.newPostButtonLabel)
      }
      if (type === 'postsSearch') {
        const d = (s_.postsSearch ?? s_) as Record<string, unknown>
        update.posts_search_placeholder = s(d.searchPlaceholder)
      }
      if (type === 'postsTable') {
        const d = (s_.postsTable ?? s_) as Record<string, unknown>
        update.posts_col_title           = s(d.colTitle)
        update.posts_col_status          = s(d.colStatus)
        update.posts_col_tags            = s(d.colTags)
        update.posts_col_modified        = s(d.colLastModified)
        update.posts_empty_title         = s(d.emptyTitle)
        update.posts_empty_body          = s(d.emptyBody)
        update.posts_empty_cta           = s(d.emptyCtaLabel)
        update.posts_load_more           = s(d.loadMoreLabel)
        update.posts_view_label          = s(d.viewPostLabel)
        update.posts_edit_label          = s(d.editPostLabel)
        update.posts_delete_label        = s(d.deletePostLabel)
        update.posts_delete_dialog_title = s(d.deleteDialogTitle)
        update.posts_delete_dialog_body  = s(d.deleteDialogBody)
        update.posts_delete_confirm      = s(d.deleteDialogConfirmLabel)
        update.posts_delete_cancel       = s(d.deleteDialogCancelLabel)
      }
      if (type === 'billingHeader') {
        const d = (s_.billingHeader ?? s_) as Record<string, unknown>
        update.billing_heading    = s(d.heading)
        update.billing_subheading = s(d.subheading)
      }
      if (type === 'billingCurrentPlan') {
        const d = (s_.billingCurrentPlan ?? s_) as Record<string, unknown>
        update.billing_current_plan_label = s(d.currentPlanLabel)
        update.billing_active_badge       = s(d.activeBadgeLabel)
        update.billing_cancelling_badge   = s(d.cancellingBadgeLabel)
        update.billing_free_badge         = s(d.freeTierBadgeLabel)
        update.billing_manage_label       = s(d.manageLabel)
        update.billing_cancel_label       = s(d.cancelLabel)
        update.billing_reactivate_label   = s(d.reactivateLabel)
        update.billing_upgrade_label      = s(d.upgradeLabel)
        update.billing_cancelling_note    = s(d.cancellingNote)
      }
      if (type === 'billingUsage') {
        const d = (s_.billingUsage ?? s_) as Record<string, unknown>
        update.billing_usage_heading = s(d.usageHeading)
        update.billing_posts_label   = s(d.postsUsageLabel)
        update.billing_api_label     = s(d.apiUsageLabel)
        update.billing_storage_label = s(d.storageUsageLabel)
        update.billing_seats_label   = s(d.seatsUsageLabel)
      }
      if (type === 'billingPlansGrid') {
        const d = (s_.billingPlansGrid ?? s_) as Record<string, unknown>
        update.billing_plans_heading    = s(d.plansHeading)
        update.billing_free_name        = s(d.freePlanName)
        update.billing_free_tagline     = s(d.freePlanTagline)
        update.billing_free_price       = s(d.freePlanPrice)
        update.billing_pro_name         = s(d.proPlanName)
        update.billing_pro_tagline      = s(d.proPlanTagline)
        update.billing_pro_badge        = s(d.proPlanBadge)
        update.billing_upgrade_cta      = s(d.upgradeLabel ?? d.upgradeCta)
        update.billing_downgrade_cta    = s(d.downgradeLabel ?? d.downgradeCta)
        update.billing_current_plan_btn = s(d.currentPlanButtonLabel ?? d.currentPlanBtn)
      }
      if (type === 'billingFooter') {
        const d = (s_.billingFooter ?? s_) as Record<string, unknown>
        update.billing_stripe_note  = s(d.stripeNote)
        update.billing_webhook_note = s(d.webhookNote)
      }
      if (type === 'billingSuccessHero') {
        const d = (s_.billingSuccessHero ?? s_) as Record<string, unknown>
        update.billing_success_heading    = s(d.heading)
        update.billing_success_subheading = s(d.subheading)
        update.billing_success_body       = s(d.body)
      }
      if (type === 'billingSuccessActions') {
        const d = (s_.billingSuccessActions ?? s_) as Record<string, unknown>
        update.billing_success_primary_label   = s(d.primaryLabel)
        update.billing_success_primary_href    = s(d.primaryHref)
        update.billing_success_secondary_label = s(d.secondaryLabel)
        update.billing_success_secondary_href  = s(d.secondaryHref)
      }
      if (type === 'settingsHeader') {
        const d = (s_.settingsHeader ?? s_) as Record<string, unknown>
        update.settings_heading    = s(d.heading)
        update.settings_subheading = s(d.subheading)
      }
      if (type === 'settingsInfo') {
        const d = (s_.settingsInfo ?? s_) as Record<string, unknown>
        update.settings_upload_photo_label = s(d.uploadPhotoLabel)
      }
      if (type === 'settingsForm') {
        const d = (s_.settingsForm ?? s_) as Record<string, unknown>
        update.settings_display_name_label  = s(d.displayNameLabel)
        update.settings_email_label         = s(d.emailLabel)
        update.settings_email_helper        = s(d.emailHelperText)
        update.settings_bio_label           = s(d.bioLabel)
        update.settings_bio_placeholder     = s(d.bioPlaceholder)
        update.settings_website_label       = s(d.websiteLabel)
        update.settings_website_placeholder = s(d.websitePlaceholder)
        update.settings_website_error       = s(d.websiteErrorText)
        update.settings_save_label          = s(d.saveLabel)
        update.settings_discard_label       = s(d.discardLabel)
      }
      if (type === 'settingsDanger') {
        const d = (s_.settingsDanger ?? s_) as Record<string, unknown>
        update.settings_danger_heading = s(d.heading)
        update.settings_danger_body    = s(d.body)
        update.settings_danger_warning = s(d.warningText)
        update.settings_delete_label   = s(d.deleteLabel)
      }
      if (type === 'admin') {
        const d = (s_.admin ?? s_) as Record<string, unknown>
        update.admin_heading                  = s(d.heading)
        update.admin_subheading               = s(d.subheading)
        update.admin_total_users_label        = s(d.totalUsersLabel)
        update.admin_pro_label                = s(d.proLabel)
        update.admin_free_label               = s(d.freeLabel)
        update.admin_col_user                 = s(d.colUser)
        update.admin_col_plan                 = s(d.colPlan)
        update.admin_col_role                 = s(d.colRole)
        update.admin_col_joined               = s(d.colJoined)
        update.admin_empty_label              = s(d.emptyLabel)
        update.admin_invite_heading           = s(d.inviteSectionHeading)
        update.admin_invite_form_title        = s(d.inviteFormTitle)
        update.admin_invite_email_label       = s(d.inviteEmailLabel)
        update.admin_invite_email_placeholder = s(d.inviteEmailPlaceholder)
        update.admin_invite_message_label     = s(d.inviteMessageLabel)
        update.admin_invite_send_label        = s(d.inviteSendLabel)
      }
      if (type === 'analytics') {
        const d = (s_.analytics ?? s_) as Record<string, unknown>
        update.analytics_heading       = s(d.heading)
        update.analytics_subheading    = s(d.subheading)
        update.analytics_events_label  = s(d.eventsLabel)
        update.analytics_users_label   = s(d.usersLabel)
        update.analytics_empty_title   = s(d.emptyTitle)
        update.analytics_empty_body    = s(d.emptyBody)
        update.analytics_refresh_label = s(d.refreshLabel)
        update.analytics_prev_label    = s(d.prevLabel)
        update.analytics_next_label    = s(d.nextLabel)
      }
    }

    const nonNull = Object.values(update).filter(v => v !== null)
    if (nonNull.length > 0) {
      const patchRes = await fetch(`${DIRECTUS_URL}/items/pages_translations/${id}?fields[]=id`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify(update),
      })
      if (patchRes.ok) {
        migrated++
        console.log(`      ✓  row ${id} (${row.languages_code}) — ${nonNull.length} fields`)
      } else {
        const t = await patchRes.text()
        console.warn(`      ⚠  row ${id} patch failed: ${t.slice(0, 120)}`)
      }
    }
  }
  console.log(`   Populated ${migrated}/${rows.length} rows`)
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

// ── site_config_translations ──────────────────────────────────────────────────

const SITE_CONFIG_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    navbar_cta_label: 'Get Started',
    navbar_login_label: 'Login',
    navbar_signup_label: 'Sign up',
    navbar_signout_label: 'Sign out',
    navbar_item_1_label: 'Posts',
    navbar_item_2_label: 'Settings',
    navbar_item_3_label: 'Billing',
    navbar_item_4_label: 'Analytics',
    navbar_item_5_label: 'Admin',
    footer_tagline: 'CMS-driven SaaS dashboard.',
    footer_copyright: `© ${new Date().getFullYear()} ContentFlow. All rights reserved.`,
    footer_col_1_heading: 'Product',
    footer_col_1_link_1_label: 'Posts',
    footer_col_1_link_2_label: 'Settings',
    footer_col_2_heading: 'Account',
    footer_col_2_link_1_label: 'Login',
    footer_col_2_link_2_label: 'Sign up',
    sidebar_brand_name: 'ContentFlow',
    sidebar_status_text: 'All systems operational',
    sidebar_nav_1_label: 'Posts',
    sidebar_nav_2_label: 'Analytics',
    sidebar_nav_3_label: 'Settings',
    sidebar_nav_4_label: 'Billing',
    sidebar_nav_5_label: 'Admin',
  },
  hi: {
    navbar_cta_label: 'शुरू करें',
    navbar_login_label: 'लॉगिन',
    navbar_signup_label: 'साइन अप',
    navbar_signout_label: 'साइन आउट',
    navbar_item_1_label: 'पोस्ट',
    navbar_item_2_label: 'सेटिंग्स',
    navbar_item_3_label: 'बिलिंग',
    navbar_item_4_label: 'विश्लेषण',
    navbar_item_5_label: 'एडमिन',
    footer_tagline: 'CMS-संचालित SaaS डैशबोर्ड।',
    footer_copyright: `© ${new Date().getFullYear()} ContentFlow. सर्वाधिकार सुरक्षित।`,
    footer_col_1_heading: 'उत्पाद',
    footer_col_1_link_1_label: 'पोस्ट',
    footer_col_1_link_2_label: 'सेटिंग्स',
    footer_col_2_heading: 'खाता',
    footer_col_2_link_1_label: 'लॉगिन',
    footer_col_2_link_2_label: 'साइन अप',
    sidebar_brand_name: 'ContentFlow',
    sidebar_status_text: 'सभी सिस्टम चालू हैं',
    sidebar_nav_1_label: 'पोस्ट',
    sidebar_nav_2_label: 'विश्लेषण',
    sidebar_nav_3_label: 'सेटिंग्स',
    sidebar_nav_4_label: 'बिलिंग',
    sidebar_nav_5_label: 'एडमिन',
  },
  kn: {
    navbar_cta_label: 'ಪ್ರಾರಂಭಿಸಿ',
    navbar_login_label: 'ಲಾಗಿನ್',
    navbar_signup_label: 'ಸೈನ್ ಅಪ್',
    navbar_signout_label: 'ಸೈನ್ ಔಟ್',
    navbar_item_1_label: 'ಪೋಸ್ಟ್‌ಗಳು',
    navbar_item_2_label: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    navbar_item_3_label: 'ಬಿಲ್ಲಿಂಗ್',
    navbar_item_4_label: 'ವಿಶ್ಲೇಷಣೆ',
    navbar_item_5_label: 'ಅಡ್ಮಿನ್',
    footer_tagline: 'CMS-ಚಾಲಿತ SaaS ಡ್ಯಾಶ್‌ಬೋರ್ಡ್.',
    footer_copyright: `© ${new Date().getFullYear()} ContentFlow. ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.`,
    footer_col_1_heading: 'ಉತ್ಪನ್ನ',
    footer_col_1_link_1_label: 'ಪೋಸ್ಟ್‌ಗಳು',
    footer_col_1_link_2_label: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    footer_col_2_heading: 'ಖಾತೆ',
    footer_col_2_link_1_label: 'ಲಾಗಿನ್',
    footer_col_2_link_2_label: 'ಸೈನ್ ಅಪ್',
    sidebar_brand_name: 'ContentFlow',
    sidebar_status_text: 'ಎಲ್ಲಾ ಸಿಸ್ಟಮ್‌ಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ',
    sidebar_nav_1_label: 'ಪೋಸ್ಟ್‌ಗಳು',
    sidebar_nav_2_label: 'ವಿಶ್ಲೇಷಣೆ',
    sidebar_nav_3_label: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    sidebar_nav_4_label: 'ಬಿಲ್ಲಿಂಗ್',
    sidebar_nav_5_label: 'ಅಡ್ಮಿನ್',
  },
}

async function seedSiteConfigTranslations() {
  console.log('\n🌐  Seeding site_config_translations…')

  for (const lang of ['en', 'hi', 'kn']) {
    const data = SITE_CONFIG_TRANSLATIONS[lang]
    if (!data) continue

    const existing = await reqList(
      `/items/site_config_translations?filter[site_config_id][_eq]=site-config&filter[languages_code][_eq]=${lang}&limit=1&fields[]=id`
    )

    if (existing.length) {
      const trId = existing[0].id as string | number
      await req('PATCH', `/items/site_config_translations/${trId}?fields[]=id`, data)
      console.log(`   ✓  Updated site_config translation: ${lang}`)
    } else {
      await req('POST', '/items/site_config_translations?fields[]=id', {
        site_config_id: 'site-config',
        languages_code: lang,
        ...data,
      })
      console.log(`   ✓  Created site_config translation: ${lang}`)
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
  await seedSiteConfigTranslations()
  await seedPages()
  await extractPageContentFields()
  await seedPosts()

  console.log('\n✅  Seed complete!\n')
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})
