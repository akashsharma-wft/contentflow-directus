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
 *  pages_translations   — per-language: title, + all individual content fields (hero_*, billing_*, etc.)
 *  site_config          — singleton-style (id = 'site-config'): navbar_*, footer_*, sidebar_* flat fields
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

// ── Field builder helpers ─────────────────────────────────────────────────────

function strField(field: string, note?: string, width: 'half' | 'full' = 'full') {
  return {
    field,
    payload: {
      field, type: 'string',
      meta: { interface: 'input', width, note: note ?? null },
      schema: { is_nullable: true },
    },
  }
}

function txtField(field: string, note?: string) {
  return {
    field,
    payload: {
      field, type: 'text',
      meta: { interface: 'input-multiline', width: 'full', note: note ?? null },
      schema: { is_nullable: true },
    },
  }
}

function divField(field: string, label: string) {
  return {
    field,
    payload: {
      field, type: 'alias',
      meta: {
        interface: 'presentation-divider',
        special: ['alias', 'no-data'],
        width: 'full',
        options: { title: label },
      },
      schema: null,
    },
  }
}

async function ensureFields(collection: string, fields: { field: string; payload: unknown }[]) {
  for (const { field, payload } of fields) {
    if (!(await fieldExists(collection, field))) {
      await api('POST', `/fields/${collection}`, payload)
      console.log(`  ✓ ${collection}.${field}`)
    }
  }
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

  await ensureFields('languages', [
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
  ])
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

  await ensureFields('posts', [
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
  ])

  // Hide deprecated per-language fields that moved to posts_translations
  const deprecated = ['title', 'language', 'excerpt', 'body', 'seo_title', 'seo_description']
  for (const field of deprecated) {
    if (await fieldExists('posts', field)) {
      await api('PATCH', `/fields/posts/${field}`, { meta: { hidden: true, note: '[deprecated — use translations]' } })
      console.log(`  [posts] deprecated field hidden: ${field}`)
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

  await ensureFields('posts_translations', [
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
  ])

  // O2M relation: posts_translations.posts_id → posts.id
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

  await ensureFields('pages', [
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
  ])

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

  // ── Core fields ──────────────────────────────────────────────────────────────
  await ensureFields('pages_translations', [
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
          hidden:    true,
          note:      'Internal render source. Edit content via the individual fields below or the visual editor.',
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

    // ── Hero ────────────────────────────────────────────────────────────────────
    divField('_div_hero', '🦸 Hero Section'),
    strField('hero_heading',             'Main hero heading'),
    txtField('hero_subheading',          'Hero subheading / description'),
    strField('hero_badge',               'Badge label above heading', 'half'),
    strField('hero_community_text',      'Social proof text below CTAs', 'half'),
    strField('hero_primary_cta_label',   'Primary CTA button label', 'half'),
    strField('hero_primary_cta_href',    'Primary CTA href', 'half'),
    strField('hero_secondary_cta_label', 'Secondary CTA button label', 'half'),
    strField('hero_secondary_cta_href',  'Secondary CTA href', 'half'),

    // ── Featured posts ───────────────────────────────────────────────────────────
    divField('_div_featured', '📌 Featured Posts Section'),
    strField('featured_posts_heading',    'Featured posts heading', 'half'),
    strField('featured_posts_subheading', 'Featured posts subheading', 'half'),
    strField('featured_posts_view_all',      '"View all" link label', 'half'),
    strField('featured_posts_view_all_href', '"View all" link href', 'half'),

    // ── Recent posts ─────────────────────────────────────────────────────────────
    divField('_div_recent', '🕐 Recent Posts Section'),
    strField('recent_posts_heading',    'Recent posts heading', 'half'),
    strField('recent_posts_subheading', 'Recent posts subheading', 'half'),
    strField('recent_posts_view_all',      '"View all" link label', 'half'),
    strField('recent_posts_view_all_href', '"View all" link href', 'half'),
    strField('recent_posts_load_more',     '"Load more" button label', 'half'),

    // ── CTA section ──────────────────────────────────────────────────────────────
    divField('_div_cta', '📢 CTA Section'),
    strField('cta_heading',       'CTA heading', 'half'),
    txtField('cta_body',          'CTA body text'),
    strField('cta_primary_label', 'CTA button label', 'half'),
    strField('cta_primary_href',  'CTA button href', 'half'),

    // ── Auth hero ────────────────────────────────────────────────────────────────
    divField('_div_auth_hero', '🔐 Auth Hero Section (login/signup left panel)'),
    strField('auth_hero_badge',          'Auth hero badge text', 'half'),
    strField('auth_hero_headline',       'Auth hero headline', 'half'),
    txtField('auth_hero_footer_note',    'Auth hero footer note'),
    strField('auth_hero_feature_1_text', 'Feature 1 text', 'half'),
    strField('auth_hero_feature_2_text', 'Feature 2 text', 'half'),
    strField('auth_hero_feature_3_text', 'Feature 3 text', 'half'),

    // ── Auth form ────────────────────────────────────────────────────────────────
    divField('_div_auth_form', '📝 Auth Form Section'),
    strField('auth_heading',              'Form heading', 'half'),
    strField('auth_google_label',         'Google OAuth button label', 'half'),
    strField('auth_divider_label',        'Divider text (e.g. "or")', 'half'),
    strField('auth_name_label',           'Name field label', 'half'),
    strField('auth_name_placeholder',     'Name field placeholder', 'half'),
    strField('auth_email_label',          'Email field label', 'half'),
    strField('auth_email_placeholder',    'Email field placeholder', 'half'),
    strField('auth_password_label',       'Password field label', 'half'),
    strField('auth_password_placeholder', 'Password field placeholder', 'half'),
    strField('auth_submit_label',         'Submit button label', 'half'),
    strField('auth_footer_text',          'Footer text', 'half'),
    strField('auth_footer_link_label',    'Footer link label', 'half'),
    strField('auth_footer_link_href',     'Footer link href', 'half'),

    // ── Posts page ───────────────────────────────────────────────────────────────
    divField('_div_posts', '📄 Posts Page'),
    strField('posts_heading',             'Posts page heading', 'half'),
    strField('posts_subheading',          'Posts page subheading', 'half'),
    strField('posts_api_badge',           'API badge label', 'half'),
    strField('posts_my_label',            '"My posts" stat label', 'half'),
    strField('posts_published_label',     '"Published" stat label', 'half'),
    strField('posts_drafts_label',        '"Drafts" stat label', 'half'),
    strField('posts_sync_label',          'Sync button label', 'half'),
    strField('posts_new_label',           'New post button label', 'half'),
    strField('posts_search_placeholder',  'Search placeholder', 'half'),
    strField('posts_col_title',           'Table: Title column header', 'half'),
    strField('posts_col_status',          'Table: Status column header', 'half'),
    strField('posts_col_tags',            'Table: Tags column header', 'half'),
    strField('posts_col_modified',        'Table: Last modified column header', 'half'),
    strField('posts_empty_title',         'Empty state title', 'half'),
    txtField('posts_empty_body',          'Empty state body'),
    strField('posts_empty_cta',           'Empty state CTA label', 'half'),
    strField('posts_load_more',           '"Load more" button label', 'half'),
    strField('posts_view_label',          'Row action: View', 'half'),
    strField('posts_edit_label',          'Row action: Edit', 'half'),
    strField('posts_delete_label',        'Row action: Delete', 'half'),
    strField('posts_delete_dialog_title', 'Delete dialog title', 'half'),
    txtField('posts_delete_dialog_body',  'Delete dialog body'),
    strField('posts_delete_confirm',      'Delete confirm button', 'half'),
    strField('posts_delete_cancel',       'Delete cancel button', 'half'),

    // ── Billing page ─────────────────────────────────────────────────────────────
    divField('_div_billing', '💳 Billing Page'),
    strField('billing_heading',            'Billing page heading', 'half'),
    strField('billing_subheading',         'Billing page subheading', 'half'),
    strField('billing_current_plan_label', '"Current plan" label', 'half'),
    strField('billing_active_badge',       '"Active" badge label', 'half'),
    strField('billing_cancelling_badge',   '"Cancelling" badge label', 'half'),
    strField('billing_free_badge',         '"Free" badge label', 'half'),
    strField('billing_manage_label',       '"Manage" button label', 'half'),
    strField('billing_cancel_label',       '"Cancel" button label', 'half'),
    strField('billing_reactivate_label',   '"Reactivate" button label', 'half'),
    strField('billing_upgrade_label',      '"Upgrade" button label', 'half'),
    txtField('billing_cancelling_note',    'Cancelling note text'),
    strField('billing_usage_heading',      'Usage section heading', 'half'),
    strField('billing_posts_label',        'Posts usage label', 'half'),
    strField('billing_api_label',          'API usage label', 'half'),
    strField('billing_storage_label',      'Storage usage label', 'half'),
    strField('billing_seats_label',        'Seats usage label', 'half'),
    strField('billing_plans_heading',      'Plans section heading', 'half'),
    strField('billing_free_name',          'Free plan name', 'half'),
    strField('billing_free_tagline',       'Free plan tagline', 'half'),
    strField('billing_free_price',         'Free plan price display', 'half'),
    strField('billing_pro_name',           'Pro plan name', 'half'),
    strField('billing_pro_tagline',        'Pro plan tagline', 'half'),
    strField('billing_pro_badge',          'Pro plan badge', 'half'),
    strField('billing_upgrade_cta',        'Upgrade CTA label', 'half'),
    strField('billing_downgrade_cta',      'Downgrade CTA label', 'half'),
    strField('billing_current_plan_btn',   '"Current plan" button label', 'half'),
    strField('billing_stripe_note',        'Stripe note text', 'half'),
    strField('billing_webhook_note',       'Webhook note text', 'half'),

    // ── Billing success ───────────────────────────────────────────────────────────
    divField('_div_billing_success', '✅ Billing Success Page'),
    strField('billing_success_heading',         'Success heading', 'half'),
    strField('billing_success_subheading',      'Success subheading', 'half'),
    txtField('billing_success_body',            'Success body text'),
    strField('billing_success_primary_label',   'Primary action label', 'half'),
    strField('billing_success_primary_href',    'Primary action href', 'half'),
    strField('billing_success_secondary_label', 'Secondary action label', 'half'),
    strField('billing_success_secondary_href',  'Secondary action href', 'half'),

    // ── Settings page ─────────────────────────────────────────────────────────────
    divField('_div_settings', '⚙️ Settings Page'),
    strField('settings_heading',              'Settings page heading', 'half'),
    strField('settings_subheading',           'Settings page subheading', 'half'),
    strField('settings_upload_photo_label',   'Upload photo label', 'half'),
    strField('settings_display_name_label',   'Display name field label', 'half'),
    strField('settings_email_label',          'Email field label', 'half'),
    strField('settings_email_helper',         'Email helper text', 'half'),
    strField('settings_bio_label',            'Bio field label', 'half'),
    txtField('settings_bio_placeholder',      'Bio field placeholder'),
    strField('settings_website_label',        'Website field label', 'half'),
    strField('settings_website_placeholder',  'Website field placeholder', 'half'),
    strField('settings_website_error',        'Website validation error', 'half'),
    strField('settings_save_label',           'Save button label', 'half'),
    strField('settings_discard_label',        'Discard button label', 'half'),
    strField('settings_danger_heading',       'Danger zone heading', 'half'),
    txtField('settings_danger_body',          'Danger zone body text'),
    strField('settings_danger_warning',       'Danger zone warning text', 'half'),
    strField('settings_delete_label',         'Delete account button label', 'half'),

    // ── Admin page ────────────────────────────────────────────────────────────────
    divField('_div_admin', '🛡️ Admin Page'),
    strField('admin_heading',                   'Admin page heading', 'half'),
    strField('admin_subheading',                'Admin page subheading', 'half'),
    strField('admin_total_users_label',         '"Total users" label', 'half'),
    strField('admin_pro_label',                 '"Pro" label', 'half'),
    strField('admin_free_label',                '"Free" label', 'half'),
    strField('admin_col_user',                  'Table: User column header', 'half'),
    strField('admin_col_plan',                  'Table: Plan column header', 'half'),
    strField('admin_col_role',                  'Table: Role column header', 'half'),
    strField('admin_col_joined',                'Table: Joined column header', 'half'),
    strField('admin_empty_label',               'Empty users label', 'half'),
    strField('admin_invite_heading',            'Invite section heading', 'half'),
    strField('admin_invite_form_title',         'Invite form title', 'half'),
    strField('admin_invite_email_label',        'Invite email label', 'half'),
    strField('admin_invite_email_placeholder',  'Invite email placeholder', 'half'),
    strField('admin_invite_message_label',      'Invite message label', 'half'),
    strField('admin_invite_send_label',         'Invite send button label', 'half'),

    // ── Analytics page ────────────────────────────────────────────────────────────
    divField('_div_analytics', '📊 Analytics Page'),
    strField('analytics_heading',        'Analytics heading', 'half'),
    strField('analytics_subheading',     'Analytics subheading', 'half'),
    strField('analytics_events_label',   'Events count label', 'half'),
    strField('analytics_users_label',    'Unique users label', 'half'),
    strField('analytics_empty_title',    'Empty state title', 'half'),
    txtField('analytics_empty_body',     'Empty state body'),
    strField('analytics_refresh_label',  'Refresh button label', 'half'),
    strField('analytics_prev_label',     '"Previous" pagination label', 'half'),
    strField('analytics_next_label',     '"Next" pagination label', 'half'),
  ])

  // ── Relations ────────────────────────────────────────────────────────────────

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

  // Keep sections JSON hidden — editors use individual fields; JSON is the render source
  if (await fieldExists('pages_translations', 'sections')) {
    await api('PATCH', '/fields/pages_translations/sections', {
      meta: {
        hidden: true,
        note: 'Internal render source. Edit content via the individual fields below or the visual editor.',
      },
    })
    console.log(`  ${TAG} sections JSON field hidden`)
  }
}

// ── Shared dropdown choices ───────────────────────────────────────────────────

const ACCESS_CHOICES = [
  { text: 'Logged-in users',  value: 'user'  },
  { text: 'Admins only',      value: 'admin' },
  { text: 'Everyone (guest)', value: 'guest' },
]

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
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
    // Ensure singleton is OFF — the translations alias field causes 403 on Directus Cloud
    // when singleton=true tries to expand alias fields in GET /items/site_config.
    const colRes = (await api('GET', `/collections/site_config`)) as { data?: { meta?: { singleton?: boolean } } }
    if (colRes?.data?.meta?.singleton === true) {
      await api('PATCH', '/collections/site_config', { meta: { singleton: false } })
      console.log(`  ${TAG} singleton disabled (alias field conflict on Cloud)`)
    }
  }

  await ensureFields('site_config', [
    {
      field: 'site_name',
      payload: {
        field: 'site_name', type: 'string',
        meta: { interface: 'input', width: 'full', required: true },
        schema: { is_nullable: false },
      },
    },

    // ── Navbar ────────────────────────────────────────────────────────────────
    divField('_div_navbar', '🔝 Navbar'),
    strField('navbar_brand_name', 'Brand name', 'half'),
    strField('navbar_cta_href',   'CTA button href', 'half'),

    // ── Footer ────────────────────────────────────────────────────────────────
    divField('_div_footer', '🦶 Footer'),
    strField('footer_brand_name', 'Brand name', 'half'),

    // ── Sidebar ───────────────────────────────────────────────────────────────
    divField('_div_sidebar', '📌 Sidebar'),
    strField('sidebar_brand_name',     'Brand name', 'half'),
    strField('sidebar_brand_subtitle', 'Brand subtitle', 'half'),
    strField('sidebar_status_badge',   'Status badge', 'half'),
  ])

  // Hide all legacy/unnecessary fields
  const toHide = [
    // old JSON blob configs
    'navbar_config', 'footer_config', 'sidebar_config', 'mobile_nav_config',
    // JSON list fields — nav items now live in translations as per-language lists
    'navbar_items', 'sidebar_nav_items', 'mobile_nav_items', 'footer_columns',
    // old per-lang flat label fields
    'navbar_cta_label_en', 'navbar_cta_label_hi', 'navbar_cta_label_kn',
    'navbar_login_label_en', 'navbar_login_label_hi', 'navbar_login_label_kn',
    'navbar_signup_label_en', 'navbar_signup_label_hi', 'navbar_signup_label_kn',
    'navbar_signout_label_en', 'navbar_signout_label_hi', 'navbar_signout_label_kn',
    // extra href fields not needed
    'navbar_signout_href', 'footer_privacy_href', 'footer_terms_href',
    // old divider aliases that shouldn't be visible
    '_div_navbar_items', '_div_footer_cols', '_div_sidebar_nav',
    'sidebar_status_text',
    ...[1,2,3,4,5].flatMap(n => [
      `navbar_item_${n}_label_en`, `navbar_item_${n}_label_hi`, `navbar_item_${n}_label_kn`, `navbar_item_${n}_href`,
      `sidebar_nav_${n}_label_en`, `sidebar_nav_${n}_label_hi`, `sidebar_nav_${n}_label_kn`, `sidebar_nav_${n}_href`,
    ]),
    'footer_tagline_en', 'footer_tagline_hi', 'footer_tagline_kn',
    'footer_copyright_en', 'footer_copyright_hi', 'footer_copyright_kn',
    ...[1,2].flatMap(c => [
      `footer_col_${c}_heading_en`, `footer_col_${c}_heading_hi`, `footer_col_${c}_heading_kn`,
      ...[1,2].flatMap(l => [
        `footer_col_${c}_link_${l}_label_en`, `footer_col_${c}_link_${l}_label_hi`, `footer_col_${c}_link_${l}_label_kn`,
        `footer_col_${c}_link_${l}_href`,
      ]),
    ]),
  ]
  for (const field of toHide) {
    if (await fieldExists('site_config', field)) {
      await api('PATCH', `/fields/site_config/${field}`, { meta: { hidden: true } })
    }
  }
  console.log(`  ${TAG} legacy fields hidden`)
}

// ── site_config_translations ──────────────────────────────────────────────────

async function bootstrapSiteConfigTranslations() {
  const TAG = '[site_config_translations]'

  if (!(await collectionExists('site_config_translations'))) {
    await api('POST', '/collections', {
      collection: 'site_config_translations',
      meta: {
        icon: 'translate',
        display_template: '{{languages_code}}',
        hidden: false,
        sort_field: null,
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: { hidden: true, readonly: true, interface: 'input', special: ['cast-integer'] },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
      ],
    })
    console.log(`  ${TAG} collection created`)
  } else {
    console.log(`  ${TAG} already exists — checking fields…`)
  }

  await ensureFields('site_config_translations', [
    {
      field: 'site_config_id',
      payload: { field: 'site_config_id', type: 'string', meta: { interface: 'input', hidden: true }, schema: { is_nullable: false } },
    },
    {
      field: 'languages_code',
      payload: { field: 'languages_code', type: 'string', meta: { interface: 'input', hidden: true }, schema: { is_nullable: false } },
    },

    // Navbar items — per-language list
    divField('_div_sc_navbar_items', '🔗 Navbar Items'),
    {
      field: 'navbar_items',
      payload: {
        field: 'navbar_items', type: 'json',
        meta: {
          interface: 'list', width: 'full',
          options: {
            template: '{{label}} → {{href}}',
            fields: [
              { field: 'label',  name: 'Label',      type: 'string', meta: { interface: 'input', width: 'half' } },
              { field: 'href',   name: 'Href',        type: 'string', meta: { interface: 'input', width: 'half' } },
              { field: 'access', name: 'Visible to',  type: 'string', meta: { interface: 'select-dropdown', width: 'full', options: { choices: ACCESS_CHOICES } } },
            ],
          },
        },
        schema: { is_nullable: true },
      },
    },

    // Sidebar items — per-language list with icon
    divField('_div_sc_sidebar_items', '📌 Sidebar Items'),
    {
      field: 'sidebar_items',
      payload: {
        field: 'sidebar_items', type: 'json',
        meta: {
          interface: 'list', width: 'full',
          options: {
            template: '{{label}} → {{href}}',
            fields: [
              { field: 'label',  name: 'Label',       type: 'string', meta: { interface: 'input', width: 'half' } },
              { field: 'href',   name: 'Href',         type: 'string', meta: { interface: 'input', width: 'half' } },
              { field: 'icon',   name: 'Icon',         type: 'string', meta: { interface: 'input', width: 'half', note: 'Lucide: FileText, Settings, CreditCard, BarChart3, Shield' } },
              { field: 'access', name: 'Visible to',   type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: ACCESS_CHOICES } } },
            ],
          },
        },
        schema: { is_nullable: true },
      },
    },

    // Footer columns — per-language list with nested links
    divField('_div_sc_footer_cols', '📋 Footer Columns'),
    {
      field: 'footer_columns',
      payload: {
        field: 'footer_columns', type: 'json',
        meta: {
          interface: 'list', width: 'full',
          options: {
            template: '{{heading}}',
            fields: [
              { field: 'heading', name: 'Heading', type: 'string', meta: { interface: 'input', width: 'full' } },
              { field: 'links', name: 'Links', type: 'json', meta: {
                interface: 'list', width: 'full',
                options: {
                  template: '{{label}} → {{href}}',
                  fields: [
                    { field: 'label', name: 'Label', type: 'string', meta: { interface: 'input', width: 'half' } },
                    { field: 'href',  name: 'Href',  type: 'string', meta: { interface: 'input', width: 'half' } },
                  ],
                },
              }},
            ],
          },
        },
        schema: { is_nullable: true },
      },
    },

    // Mobile nav items — per-language list with icon
    divField('_div_sc_mobile_nav_items', '📱 Mobile Nav Items'),
    {
      field: 'mobile_nav_items',
      payload: {
        field: 'mobile_nav_items', type: 'json',
        meta: {
          interface: 'list', width: 'full',
          options: {
            template: '{{label}} → {{href}}',
            fields: [
              { field: 'label',  name: 'Label',       type: 'string', meta: { interface: 'input', width: 'half' } },
              { field: 'href',   name: 'Href',         type: 'string', meta: { interface: 'input', width: 'half' } },
              { field: 'icon',   name: 'Icon',         type: 'string', meta: { interface: 'input', width: 'half', note: 'Lucide: FileText, Settings, CreditCard, BarChart3, Shield' } },
              { field: 'access', name: 'Visible to',   type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: ACCESS_CHOICES } } },
            ],
          },
        },
        schema: { is_nullable: true },
      },
    },
  ])

  // Hide removed label fields that may exist from previous bootstrap runs
  const removedTranslationFields = [
    '_div_sc_navbar', 'navbar_cta_label', 'navbar_login_label', 'navbar_signup_label', 'navbar_signout_label',
    '_div_sc_footer', 'footer_tagline', 'footer_copyright',
    '_div_sc_sidebar', 'sidebar_brand_name', 'sidebar_status_text',
  ]
  for (const field of removedTranslationFields) {
    if (await fieldExists('site_config_translations', field)) {
      await api('PATCH', `/fields/site_config_translations/${field}`, { meta: { hidden: true } })
      console.log(`  [site_config_translations] hidden: ${field}`)
    }
  }

  // FK: site_config_id → site_config
  // Delete then recreate so we can set one_field = 'translations' (PATCH doesn't work on Directus Cloud)
  await fetch(`${BASE_URL}/relations/site_config_translations/site_config_id`, {
    method: 'DELETE', headers: HEADERS,
  }).catch(() => {/* ignore if not tracked */})
  try {
    await api('POST', '/relations', {
      collection: 'site_config_translations',
      field: 'site_config_id',
      related_collection: 'site_config',
      meta: {
        many_collection:     'site_config_translations',
        many_field:          'site_config_id',
        one_collection:      'site_config',
        one_field:           'translations',
        one_deselect_action: 'nullify',
        sort_field:          null,
      },
      schema: {
        table: 'site_config_translations', column: 'site_config_id',
        foreign_key_table: 'site_config', foreign_key_column: 'id',
        on_update: 'NO ACTION', on_delete: 'CASCADE',
      },
    })
    console.log(`  ${TAG} relation site_config_id → site_config created (one_field=translations)`)
  } catch (e) {
    const msg = (e as Error).message ?? ''
    if (!msg.includes('already exists') && !msg.includes('UNIQUE') && !msg.includes('duplicate')) throw e
    console.log(`  ${TAG} relation site_config_id → site_config already exists`)
  }

  // FK: languages_code → languages
  if (!(await relationExists('site_config_translations', 'languages_code'))) {
    await api('POST', '/relations', {
      collection: 'site_config_translations',
      field: 'languages_code',
      related_collection: 'languages',
      meta: { junction_field: null },
      schema: { on_delete: 'CASCADE' },
    })
    console.log(`  ${TAG} relation languages_code → languages created`)
  }

  // Add translations alias to site_config — shows clickable translation list like Pages
  if (!(await fieldExists('site_config', 'translations'))) {
    await api('POST', '/fields/site_config', {
      field: 'translations',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        options: { enableCreate: true, enableSelect: false },
        display: 'related-values',
        display_options: { template: '{{languages_code}}' },
        width: 'full',
        readonly: false,
        hidden: false,
      },
      schema: null,
    })
    console.log(`  ${TAG} translations alias added to site_config`)
  }

  // Hide site_config_translations from sidebar (accessed via Site Config → Translations)
  await api('PATCH', '/collections/site_config_translations', { meta: { hidden: true } })
  console.log(`  ${TAG} site_config_translations hidden from sidebar`)

  // Set collection preview URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  await api('PATCH', '/collections/site_config', {
    meta: { preview_url: `${appUrl}?preview={{KEY}}` },
  })

  console.log(`  ${TAG} done`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  ContentFlow — Directus schema bootstrap (with translations + flat fields)')
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

  console.log('📦  pages_translations (all content fields)…')
  await bootstrapPagesTranslations()
  console.log()

  console.log('📦  site_config (flat fields)…')
  await bootstrapSiteConfig()

  console.log('\n📦  site_config_translations…')
  await bootstrapSiteConfigTranslations()

  // body_html — HTML rich text editor
  if (!(await fieldExists('posts_translations', 'body_html'))) {
    await api('POST', '/fields/posts_translations', {
      field: 'body_html', type: 'text',
      meta: {
        interface: 'input-rich-text-html',
        display_name: 'Body',
        width: 'full',
        note: 'Post body. Use the rich text editor to format content.',
      },
      schema: { is_nullable: true },
    })
    console.log('  ✓ posts_translations.body_html added (rich text HTML)')
  } else {
    await api('PATCH', '/fields/posts_translations/body_html', {
      meta: {
        interface: 'input-rich-text-html',
        display_name: 'Body',
        options: null,
        note: 'Post body. Use the rich text editor to format content.',
        hidden: false,
      },
    })
    console.log('  ✓ posts_translations.body_html set to rich text HTML editor')
  }
  // Hide excerpt — title + image + description is enough
  if (await fieldExists('posts_translations', 'excerpt')) {
    await api('PATCH', '/fields/posts_translations/excerpt', { meta: { hidden: true } })
    console.log('  ✓ posts_translations.excerpt hidden')
  }
  // Hide the old JSON body field
  if (await fieldExists('posts_translations', 'body')) {
    await api('PATCH', '/fields/posts_translations/body', {
      meta: { hidden: true, note: '[deprecated — use body_html]' },
    })
    console.log('  ✓ posts_translations.body hidden (deprecated)')
  }

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
  console.log('── Next steps ───────────────────────────────────────────────────────')
  console.log('   1. npm run directus:seed     — seed initial pages, posts, site config')
  console.log('   2. npm run directus:migrate  — populate individual fields from JSON data')
  console.log('      (skip step 2 if seeding fresh — migrate reads from existing JSON)\n')
}

main().catch(err => {
  console.error('\n❌  Bootstrap failed:', err.message)
  process.exit(1)
})
