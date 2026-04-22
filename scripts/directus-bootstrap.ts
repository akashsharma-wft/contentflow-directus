/**
 * scripts/directus-bootstrap.ts
 *
 * Creates / verifies the ContentFlow Directus schema.
 * Safe to re-run — only ADDs or updates metadata; never deletes data.
 *
 * Schema overview
 * ───────────────
 *  languages            — { code (PK), name, direction }
 *  posts                — non-translatable parent: slug, cover_image, published_at, author_*…
 *  posts_translations   — per-language: title, excerpt, body, seo_title, seo_description
 *  pages                — non-translatable parent: slug, status, access, layout, og_image
 *  pages_translations   — per-language: title, sections (JSON), seo_title, seo_description
 *  site_config          — singleton-style (id = 'site-config'): navbar_config, footer_config…
 *
 * Relations wired for Directus "Translations" interface:
 *   posts_translations.posts_id  → posts.id       (O2M, cascade delete)
 *   posts_translations.languages_code → languages.code
 *   pages_translations.pages_id  → pages.id       (O2M, cascade delete)
 *   pages_translations.languages_code → languages.code
 *
 * Usage:  npm run directus:bootstrap
 */

import 'dotenv/config'

const BASE_URL    = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN

if (!ADMIN_TOKEN) {
  console.error('❌  DIRECTUS_ADMIN_TOKEN not set. Add it to .env.local.')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ADMIN_TOKEN}`,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function api(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
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
  return data
}

async function collectionExists(name: string): Promise<boolean> {
  try { await api('GET', `/collections/${name}`); return true } catch { return false }
}

async function fieldExists(collection: string, field: string): Promise<boolean> {
  try { await api('GET', `/fields/${collection}/${field}`); return true } catch { return false }
}

async function relationExists(collection: string, field: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${BASE_URL}/relations?filter[collection][_eq]=${collection}&filter[field][_eq]=${field}`,
      { headers: HEADERS }
    )
    if (!res.ok) return false
    const data = (await res.json()) as { data?: unknown[] }
    return (data.data?.length ?? 0) > 0
  } catch { return false }
}

// ── languages ─────────────────────────────────────────────────────────────────

async function bootstrapLanguages() {
  const TAG = '[languages]'

  if (!(await collectionExists('languages'))) {
    await api('POST', '/collections', {
      collection: 'languages',
      meta: {
        icon:             'translate',
        display_template: '{{name}}',
        sort_field:       null,
      },
      schema: {},
      fields: [
        {
          field: 'code',
          type:  'string',
          meta:  { interface: 'input', width: 'half', required: true },
          schema: { is_primary_key: true, length: 20, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
  }

  const fields: { field: string; payload: unknown }[] = [
    {
      field: 'name',
      payload: {
        field: 'name', type: 'string',
        meta: { interface: 'input', width: 'half', required: true },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'direction',
      payload: {
        field: 'direction', type: 'string',
        meta: {
          interface: 'select-dropdown',
          width:     'half',
          options:   { choices: [{ text: 'LTR', value: 'ltr' }, { text: 'RTL', value: 'rtl' }] },
        },
        schema: { is_nullable: true, default_value: 'ltr' },
      },
    },
  ]

  for (const { field, payload } of fields) {
    if (!(await fieldExists('languages', field))) {
      await api('POST', '/fields/languages', payload)
      console.log(`  ${TAG} field created: ${field}`)
    }
  }
}

// ── posts ─────────────────────────────────────────────────────────────────────

async function bootstrapPosts() {
  const TAG = '[posts]'

  if (!(await collectionExists('posts'))) {
    await api('POST', '/collections', {
      collection: 'posts',
      meta: {
        icon:             'article',
        display_template: '{{slug}}',
        sort_field:       'date_created',
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type:  'uuid',
          meta:  { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
          schema: { is_primary_key: true, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
  }

  // Non-translatable parent fields
  const parentFields: { field: string; payload: unknown }[] = [
    {
      field: 'slug',
      payload: {
        field: 'slug', type: 'string',
        meta: { interface: 'input', required: true, width: 'half', note: 'URL-safe. Unique — shared across all language translations.' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'cover_image',
      payload: {
        field: 'cover_image', type: 'string',
        meta: { interface: 'input', width: 'full', note: 'Direct image URL (Supabase Storage or external)' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'published_at',
      payload: {
        field: 'published_at', type: 'dateTime',
        meta: { interface: 'datetime', width: 'half', note: 'Null = draft' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'featured',
      payload: {
        field: 'featured', type: 'boolean',
        meta: { interface: 'boolean', width: 'half' },
        schema: { is_nullable: false, default_value: false },
      },
    },
    {
      field: 'tags',
      payload: {
        field: 'tags', type: 'json',
        meta: { interface: 'tags', width: 'full' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'author_id',
      payload: {
        field: 'author_id', type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Supabase user UUID' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'author_name',
      payload: {
        field: 'author_name', type: 'string',
        meta: { interface: 'input', width: 'half' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'author_email',
      payload: {
        field: 'author_email', type: 'string',
        meta: { interface: 'input', width: 'half' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'author_avatar',
      payload: {
        field: 'author_avatar', type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Direct avatar URL' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'date_created',
      payload: {
        field: 'date_created', type: 'timestamp',
        meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'date_updated',
      payload: {
        field: 'date_updated', type: 'timestamp',
        meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of parentFields) {
    if (!(await fieldExists('posts', field))) {
      await api('POST', '/fields/posts', payload)
      console.log(`  ${TAG} field created: ${field}`)
    }
  }

  // Hide deprecated per-language fields that moved to posts_translations
  const deprecated = ['title', 'language', 'excerpt', 'body', 'seo_title', 'seo_description']
  for (const field of deprecated) {
    if (await fieldExists('posts', field)) {
      await api('PATCH', `/fields/posts/${field}`, { meta: { hidden: true, note: '[deprecated — use translations]' } })
      console.log(`  ${TAG} deprecated field hidden: ${field}`)
    }
  }
}

// ── posts_translations ────────────────────────────────────────────────────────

async function bootstrapPostsTranslations() {
  const TAG = '[posts_translations]'

  if (!(await collectionExists('posts_translations'))) {
    await api('POST', '/collections', {
      collection: 'posts_translations',
      meta: {
        icon:   'translate',
        hidden: true,
        display_template: '{{languages_code}}: {{title}}',
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type:  'integer',
          meta:  { hidden: true, readonly: true, interface: 'input', special: ['cast-to-integer'] },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
      ],
    })
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
  }

  const fields: { field: string; payload: unknown }[] = [
    {
      field: 'posts_id',
      payload: {
        field: 'posts_id', type: 'uuid',
        meta:  { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true, width: 'half' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'languages_code',
      payload: {
        field: 'languages_code', type: 'string',
        meta:  { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', display: 'related-values', display_options: { template: '{{name}}' } },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'title',
      payload: {
        field: 'title', type: 'string',
        meta:  { interface: 'input', required: true, width: 'full' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'excerpt',
      payload: {
        field: 'excerpt', type: 'text',
        meta:  { interface: 'input-multiline', width: 'full' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'body',
      payload: {
        field: 'body', type: 'json',
        meta: {
          interface: 'input-code',
          options:   { language: 'json' },
          width:     'full',
          note:      'PortableText block array',
        },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'seo_title',
      payload: {
        field: 'seo_title', type: 'string',
        meta:  { interface: 'input', width: 'half', note: 'Max 60 chars' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'seo_description',
      payload: {
        field: 'seo_description', type: 'text',
        meta:  { interface: 'input-multiline', width: 'half', note: 'Max 160 chars' },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of fields) {
    if (!(await fieldExists('posts_translations', field))) {
      await api('POST', '/fields/posts_translations', payload)
      console.log(`  ${TAG} field created: ${field}`)
    }
  }

  // O2M relation: posts_translations.posts_id → posts.id
  // one_field: 'translations' exposes the O2M in the Directus admin on the parent.
  // The alias field on posts (created below) must have type='alias' + schema=null.
  // Writes to posts/pages pass fields:['id'] to avoid the post-write SELECT bug.
  if (!(await relationExists('posts_translations', 'posts_id'))) {
    await api('POST', '/relations', {
      collection:         'posts_translations',
      field:              'posts_id',
      related_collection: 'posts',
      meta: {
        many_collection:       'posts_translations',
        many_field:            'posts_id',
        one_collection:        'posts',
        one_field:             'translations',
        one_deselect_action:   'nullify',
        sort_field:            null,
      },
      schema: {
        table:               'posts_translations',
        column:              'posts_id',
        foreign_key_table:   'posts',
        foreign_key_column:  'id',
        on_update:           'NO ACTION',
        on_delete:           'CASCADE',
      },
    })
    console.log(`  ${TAG} relation created: posts_id → posts.id`)
  }

  // M2O relation: posts_translations.languages_code → languages.code
  if (!(await relationExists('posts_translations', 'languages_code'))) {
    await api('POST', '/relations', {
      collection:         'posts_translations',
      field:              'languages_code',
      related_collection: 'languages',
      meta: {
        many_collection:     'posts_translations',
        many_field:          'languages_code',
        one_collection:      'languages',
        one_field:           null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table:              'posts_translations',
        column:             'languages_code',
        foreign_key_table:  'languages',
        foreign_key_column: 'code',
        on_update:          'NO ACTION',
        on_delete:          'CASCADE',
      },
    })
    console.log(`  ${TAG} relation created: languages_code → languages.code`)
  }

  // Alias field: posts.translations (type='alias', schema=null — virtual, no DB column)
  if (!(await fieldExists('posts', 'translations'))) {
    await api('POST', '/fields/posts', {
      field: 'translations', type: 'alias',
      meta: {
        special: ['o2m'], interface: 'list-o2m',
        options: { enableCreate: true, enableSelect: false },
        display: 'related-values', display_options: { template: '{{languages_code}}: {{title}}' },
        readonly: false, hidden: false, width: 'full',
      },
      schema: null,
    })
    console.log(`  ${TAG} alias field created: posts.translations`)
  }
}

// ── pages ─────────────────────────────────────────────────────────────────────

async function bootstrapPages() {
  const TAG = '[pages]'

  if (!(await collectionExists('pages'))) {
    await api('POST', '/collections', {
      collection: 'pages',
      meta: {
        icon:             'article_shortcut',
        display_template: '{{slug}}',
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type:  'uuid',
          meta:  { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
          schema: { is_primary_key: true, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
  }

  const parentFields: { field: string; payload: unknown }[] = [
    {
      field: 'slug',
      payload: {
        field: 'slug', type: 'string',
        meta: { interface: 'input', required: true, width: 'half', note: 'e.g. home, login, posts. Shared across translations.' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'status',
      payload: {
        field: 'status', type: 'string',
        meta: {
          interface: 'select-dropdown', width: 'half', required: true,
          options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] },
        },
        schema: { is_nullable: false, default_value: 'published' },
      },
    },
    {
      field: 'access',
      payload: {
        field: 'access', type: 'string',
        meta: {
          interface: 'select-dropdown', width: 'half',
          options: {
            choices: [
              { text: 'Guest (public)',       value: 'guest' },
              { text: 'User (auth required)', value: 'user' },
              { text: 'Admin only',           value: 'admin' },
            ],
          },
        },
        schema: { is_nullable: true, default_value: 'guest' },
      },
    },
    {
      field: 'layout',
      payload: {
        field: 'layout', type: 'string',
        meta: {
          interface: 'select-dropdown', width: 'half',
          options: {
            choices: [
              { text: 'Home (Navbar + Footer)', value: 'home' },
              { text: 'Dashboard (Sidebar)',    value: 'dashboard' },
              { text: 'Auth (no chrome)',       value: 'auth' },
            ],
          },
        },
        schema: { is_nullable: true, default_value: 'home' },
      },
    },
    {
      field: 'og_image',
      payload: {
        field: 'og_image', type: 'string',
        meta: { interface: 'input', width: 'full', note: 'Open Graph image URL (shared across translations)' },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of parentFields) {
    if (!(await fieldExists('pages', field))) {
      await api('POST', `/fields/pages`, payload)
      console.log(`  ${TAG} field created: ${field}`)
    }
  }

  // Hide deprecated per-language fields
  const deprecated = ['title', 'language', 'sections', 'seo_title', 'seo_description']
  for (const field of deprecated) {
    if (await fieldExists('pages', field)) {
      await api('PATCH', `/fields/pages/${field}`, { meta: { hidden: true, note: '[deprecated — use translations]' } })
      console.log(`  ${TAG} deprecated field hidden: ${field}`)
    }
  }
}

// ── pages_translations ────────────────────────────────────────────────────────

async function bootstrapPagesTranslations() {
  const TAG = '[pages_translations]'

  if (!(await collectionExists('pages_translations'))) {
    await api('POST', '/collections', {
      collection: 'pages_translations',
      meta: {
        icon:   'translate',
        hidden: true,
        display_template: '{{languages_code}}: {{title}}',
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type:  'integer',
          meta:  { hidden: true, readonly: true, interface: 'input', special: ['cast-to-integer'] },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
      ],
    })
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
  }

  const fields: { field: string; payload: unknown }[] = [
    {
      field: 'pages_id',
      payload: {
        field: 'pages_id', type: 'uuid',
        meta:  { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true, width: 'half' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'languages_code',
      payload: {
        field: 'languages_code', type: 'string',
        meta:  { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'title',
      payload: {
        field: 'title', type: 'string',
        meta:  { interface: 'input', width: 'full' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'sections',
      payload: {
        field: 'sections', type: 'json',
        meta: {
          interface: 'input-code',
          options:   { language: 'json' },
          width:     'full',
          note:      'SectionRenderer config array — all copy/labels for this language',
        },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'seo_title',
      payload: {
        field: 'seo_title', type: 'string',
        meta:  { interface: 'input', width: 'half', note: 'Max 60 chars' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'seo_description',
      payload: {
        field: 'seo_description', type: 'text',
        meta:  { interface: 'input-multiline', width: 'half', note: 'Max 160 chars' },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of fields) {
    if (!(await fieldExists('pages_translations', field))) {
      await api('POST', '/fields/pages_translations', payload)
      console.log(`  ${TAG} field created: ${field}`)
    }
  }

  // O2M: pages_translations.pages_id → pages.id
  if (!(await relationExists('pages_translations', 'pages_id'))) {
    await api('POST', '/relations', {
      collection:         'pages_translations',
      field:              'pages_id',
      related_collection: 'pages',
      meta: {
        many_collection:     'pages_translations',
        many_field:          'pages_id',
        one_collection:      'pages',
        one_field:           'translations',
        one_deselect_action: 'nullify',
        sort_field:          null,
      },
      schema: {
        table:              'pages_translations',
        column:             'pages_id',
        foreign_key_table:  'pages',
        foreign_key_column: 'id',
        on_update:          'NO ACTION',
        on_delete:          'CASCADE',
      },
    })
    console.log(`  ${TAG} relation created: pages_id → pages.id`)
  }

  // M2O: pages_translations.languages_code → languages.code
  if (!(await relationExists('pages_translations', 'languages_code'))) {
    await api('POST', '/relations', {
      collection:         'pages_translations',
      field:              'languages_code',
      related_collection: 'languages',
      meta: {
        many_collection:     'pages_translations',
        many_field:          'languages_code',
        one_collection:      'languages',
        one_field:           null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table:              'pages_translations',
        column:             'languages_code',
        foreign_key_table:  'languages',
        foreign_key_column: 'code',
        on_update:          'NO ACTION',
        on_delete:          'CASCADE',
      },
    })
    console.log(`  ${TAG} relation created: languages_code → languages.code`)
  }

  // Alias field: pages.translations (type='alias', schema=null — virtual, no DB column)
  if (!(await fieldExists('pages', 'translations'))) {
    await api('POST', '/fields/pages', {
      field: 'translations', type: 'alias',
      meta: {
        special: ['o2m'], interface: 'list-o2m',
        options: { enableCreate: true, enableSelect: false },
        display: 'related-values', display_options: { template: '{{languages_code}}: {{title}}' },
        readonly: false, hidden: false, width: 'full',
      },
      schema: null,
    })
    console.log(`  ${TAG} alias field created: pages.translations`)
  }
}

// ── site_config ───────────────────────────────────────────────────────────────

async function bootstrapSiteConfig() {
  const TAG = '[site_config]'

  if (!(await collectionExists('site_config'))) {
    await api('POST', '/collections', {
      collection: 'site_config',
      meta: { icon: 'settings', display_template: '{{site_name}}' },
      schema: {},
      fields: [
        {
          field: 'id',
          type:  'string',
          meta:  { hidden: true, readonly: true, interface: 'input', special: null },
          schema: { is_primary_key: true, length: 255, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${TAG} collection created (regular, string PK)`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
    const meta = (await api('GET', `/collections/site_config`)) as { data?: { meta?: { singleton?: boolean } } }
    if (meta?.data?.meta?.singleton === true) {
      await api('PATCH', '/collections/site_config', { meta: { singleton: false } })
      console.log(`  ${TAG} ⚠  singleton flag removed (required for readItem by ID)`)
    }
  }

  const fields: { field: string; payload: unknown }[] = [
    {
      field: 'site_name',
      payload: {
        field: 'site_name', type: 'string',
        meta: { interface: 'input', width: 'full', required: true },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'navbar_config',
      payload: {
        field: 'navbar_config', type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', note: 'Nav items use label: {"en":…,"hi":…,"kn":…}' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'footer_config',
      payload: {
        field: 'footer_config', type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'sidebar_config',
      payload: {
        field: 'sidebar_config', type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'mobile_nav_config',
      payload: {
        field: 'mobile_nav_config', type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of fields) {
    if (!(await fieldExists('site_config', field))) {
      await api('POST', '/fields/site_config', payload)
      console.log(`  ${TAG} field created: ${field}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  ContentFlow — Directus schema bootstrap (with translations)')
  console.log(`    URL: ${BASE_URL}\n`)

  try {
    await api('GET', '/collections')
    console.log('✓  Directus reachable\n')
  } catch (err) {
    console.error('❌  Cannot reach Directus:', (err as Error).message)
    process.exit(1)
  }

  console.log('📦  languages…')
  await bootstrapLanguages()
  console.log()

  console.log('📦  posts (parent fields)…')
  await bootstrapPosts()
  console.log()

  console.log('📦  posts_translations…')
  await bootstrapPostsTranslations()
  console.log()

  console.log('📦  pages (parent fields)…')
  await bootstrapPages()
  console.log()

  console.log('📦  pages_translations…')
  await bootstrapPagesTranslations()
  console.log()

  console.log('📦  site_config…')
  await bootstrapSiteConfig()

  console.log('\n✅  Bootstrap complete!')
  console.log('\n── Access Policy (update in Directus dashboard) ─────────────────────')
  console.log('   "ContentFlow Public Read" policy needs Read on:')
  console.log('     posts                — filter: published_at._nnull  fields: *')
  console.log('     posts_translations   — no filter                     fields: *')
  console.log('     pages                — filter: status._eq=published  fields: *')
  console.log('     pages_translations   — no filter                     fields: *')
  console.log('     languages            — no filter                     fields: *')
  console.log('     site_config          — no filter                     fields: *')
  console.log()
  console.log('── Next: seed data ──────────────────────────────────────────────────')
  console.log('   npm run directus:seed\n')
}

main().catch(err => {
  console.error('\n❌  Bootstrap failed:', err.message)
  process.exit(1)
})
