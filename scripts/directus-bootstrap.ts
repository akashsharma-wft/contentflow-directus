/**
 * scripts/directus-bootstrap.ts
 *
 * Creates the three ContentFlow collections (posts, pages, site_config) in Directus.
 * Safe to run against a Directus Cloud project that already has other collections —
 * it only ADDs; it never modifies or deletes existing collections or fields.
 * Idempotent: safe to run multiple times.
 *
 * Usage:
 *   npm run directus:bootstrap
 *
 * Required env vars (.env.local):
 *   NEXT_PUBLIC_DIRECTUS_URL  — e.g. https://your-project.directus.app
 *   DIRECTUS_ADMIN_TOKEN      — static token for an admin user
 *
 * ── Permissions (Directus v11) ──────────────────────────────────────────────
 * Directus v11 uses policy-based permissions. Automated permission creation
 * is intentionally left out of this script because the policy/role/user
 * relationship is environment-specific and hard to make idempotent via API.
 *
 * Manual setup (one-time, takes ~2 minutes):
 *   1. Settings → Access Policies → New Policy → "ContentFlow Frontend Read"
 *      App Access: OFF, Admin Access: OFF
 *   2. Inside that policy add three Read permissions:
 *        posts        — Custom filter: { "published_at": { "_nnull": true } }
 *        pages        — Custom filter: { "status": { "_eq": "published" } }
 *        site_config  — No filter (all rows)
 *      Fields: * (all) for each.
 *   3. Assign this policy to the role whose static token you use as
 *      NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN, OR assign it directly to the
 *      Public policy if you want unauthenticated read access.
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

// ── Low-level helpers ─────────────────────────────────────────────────────────

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
  try {
    await api('GET', `/collections/${name}`)
    return true
  } catch { return false }
}

async function fieldExists(collection: string, field: string): Promise<boolean> {
  try {
    await api('GET', `/fields/${collection}/${field}`)
    return true
  } catch { return false }
}

// ── posts ─────────────────────────────────────────────────────────────────────

async function bootstrapPosts() {
  const COLLECTION = 'posts'
  const tag = `[${COLLECTION}]`

  if (!(await collectionExists(COLLECTION))) {
    await api('POST', '/collections', {
      collection: COLLECTION,
      meta: {
        icon: 'article',
        display_template: '{{title}}',
        sort_field: 'date_created',
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
          schema: { is_primary_key: true, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${tag} collection created`)
  } else {
    console.log(`  ${tag} collection already exists — checking fields…`)
  }

  const fields: { field: string; payload: unknown }[] = [
    {
      field: 'title',
      payload: {
        field: 'title', type: 'string',
        meta: { interface: 'input', required: true, width: 'full' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'slug',
      payload: {
        field: 'slug', type: 'string',
        meta: { interface: 'input', required: true, width: 'half', note: 'URL-safe. Unique per language.' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'language',
      payload: {
        field: 'language', type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          required: true,
          options: {
            choices: [
              { text: 'English', value: 'en' },
              { text: 'Hindi',   value: 'hi' },
              { text: 'Kannada', value: 'kn' },
            ],
          },
        },
        schema: { is_nullable: false, default_value: 'en' },
      },
    },
    {
      field: 'excerpt',
      payload: {
        field: 'excerpt', type: 'text',
        meta: { interface: 'input-multiline', width: 'full' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'body',
      payload: {
        field: 'body', type: 'json',
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          width: 'full',
          note: 'PortableText block array — rendered by @portabletext/react',
        },
        schema: { is_nullable: true },
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

  for (const { field, payload } of fields) {
    if (!(await fieldExists(COLLECTION, field))) {
      await api('POST', `/fields/${COLLECTION}`, payload)
      console.log(`  ${tag} field created: ${field}`)
    }
  }
}

// ── pages ─────────────────────────────────────────────────────────────────────

async function bootstrapPages() {
  const COLLECTION = 'pages'
  const tag = `[${COLLECTION}]`

  if (!(await collectionExists(COLLECTION))) {
    await api('POST', '/collections', {
      collection: COLLECTION,
      meta: {
        icon: 'article_shortcut',
        display_template: '{{title}} ({{language}})',
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
          schema: { is_primary_key: true, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${tag} collection created`)
  } else {
    console.log(`  ${tag} collection already exists — checking fields…`)
  }

  const fields: { field: string; payload: unknown }[] = [
    {
      field: 'title',
      payload: {
        field: 'title', type: 'string',
        meta: { interface: 'input', required: true, width: 'full' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'slug',
      payload: {
        field: 'slug', type: 'string',
        meta: { interface: 'input', required: true, width: 'half', note: 'e.g. home, login, posts' },
        schema: { is_nullable: false },
      },
    },
    {
      field: 'language',
      payload: {
        field: 'language', type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          required: true,
          options: {
            choices: [
              { text: 'English', value: 'en' },
              { text: 'Hindi',   value: 'hi' },
              { text: 'Kannada', value: 'kn' },
            ],
          },
        },
        schema: { is_nullable: false, default_value: 'en' },
      },
    },
    {
      field: 'status',
      payload: {
        field: 'status', type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          required: true,
          options: {
            choices: [
              { text: 'Published', value: 'published' },
              { text: 'Draft',     value: 'draft' },
            ],
          },
        },
        schema: { is_nullable: false, default_value: 'published' },
      },
    },
    {
      field: 'access',
      payload: {
        field: 'access', type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          options: {
            choices: [
              { text: 'Guest (public)',      value: 'guest' },
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
          interface: 'select-dropdown',
          width: 'half',
          options: {
            choices: [
              { text: 'Home (Navbar + Footer)', value: 'home' },
              { text: 'Dashboard (Sidebar)',    value: 'dashboard' },
              { text: 'Auth (no chrome)',        value: 'auth' },
            ],
          },
        },
        schema: { is_nullable: true, default_value: 'home' },
      },
    },
    {
      field: 'sections',
      payload: {
        field: 'sections', type: 'json',
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          width: 'full',
          note: 'SectionRenderer section config array — see types/cms.ts for shape',
        },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'seo_title',
      payload: {
        field: 'seo_title', type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Max 60 chars' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'seo_description',
      payload: {
        field: 'seo_description', type: 'text',
        meta: { interface: 'input-multiline', width: 'half', note: 'Max 160 chars' },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'og_image',
      payload: {
        field: 'og_image', type: 'string',
        meta: { interface: 'input', width: 'full', note: 'Open Graph image URL' },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of fields) {
    if (!(await fieldExists(COLLECTION, field))) {
      await api('POST', `/fields/${COLLECTION}`, payload)
      console.log(`  ${tag} field created: ${field}`)
    }
  }
}

// ── site_config ───────────────────────────────────────────────────────────────
//
// IMPORTANT: site_config is a REGULAR collection with a fixed string PK
// ("site-config"), NOT a Directus singleton. This is intentional.
//
// Why not singleton:
//   The frontend reads via readItem('site_config', 'site-config') which
//   generates GET /items/site_config/site-config — the ID-addressed route.
//   Directus singletons drop the ID from the route (GET /items/site_config),
//   making them incompatible with readItem(). Using a regular collection with
//   a fixed string PK gives the same semantic guarantee with the correct routing.
//
// If Directus Cloud shows it as singleton (from a previous bootstrap run),
// this script will un-singleton it automatically via PATCH /collections/site_config.

async function bootstrapSiteConfig() {
  const COLLECTION = 'site_config'
  const tag = `[${COLLECTION}]`

  if (!(await collectionExists(COLLECTION))) {
    // Create as a regular collection (no singleton flag) with string PK
    await api('POST', '/collections', {
      collection: COLLECTION,
      meta: {
        icon: 'settings',
        display_template: '{{site_name}}',
        // singleton: false is the default — explicitly NOT setting it
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'string',
          meta: { hidden: true, readonly: true, interface: 'input', special: null },
          schema: { is_primary_key: true, length: 255, has_auto_increment: false },
        },
      ],
    })
    console.log(`  ${tag} collection created (regular, string PK)`)
  } else {
    console.log(`  ${tag} collection already exists — checking fields…`)

    // If a previous bootstrap run created it as singleton, fix that now.
    // Without this fix, GET /items/site_config/site-config returns 404
    // because singletons route to GET /items/site_config (no ID segment).
    const meta = (await api('GET', `/collections/${COLLECTION}`)) as { data?: { meta?: { singleton?: boolean } } }
    if (meta?.data?.meta?.singleton === true) {
      await api('PATCH', `/collections/${COLLECTION}`, { meta: { singleton: false } })
      console.log(`  ${tag} ⚠  was singleton — removed singleton flag (required for readItem by ID)`)
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
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          width: 'full',
          note: 'SiteNavbarConfig — brandName, items[], ctaButton, showLanguageSwitcher',
        },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'footer_config',
      payload: {
        field: 'footer_config', type: 'json',
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          width: 'full',
          note: 'SiteFooterConfig — columns[], socialLinks[]',
        },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'sidebar_config',
      payload: {
        field: 'sidebar_config', type: 'json',
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          width: 'full',
          note: 'SiteSidebarConfig — navItems[], footerLinks[]',
        },
        schema: { is_nullable: true },
      },
    },
    {
      field: 'mobile_nav_config',
      payload: {
        field: 'mobile_nav_config', type: 'json',
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          width: 'full',
          note: 'SiteMobileNavConfig — bottom tab items[]',
        },
        schema: { is_nullable: true },
      },
    },
  ]

  for (const { field, payload } of fields) {
    if (!(await fieldExists(COLLECTION, field))) {
      await api('POST', `/fields/${COLLECTION}`, payload)
      console.log(`  ${tag} field created: ${field}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  ContentFlow — Directus schema bootstrap')
  console.log(`    URL: ${BASE_URL}\n`)

  // Connectivity check — uses /collections which returns proper JSON
  // (unlike /server/ping which returns plain text "pong" and breaks JSON.parse)
  try {
    await api('GET', '/collections')
    console.log('✓  Directus reachable and token valid\n')
  } catch (err) {
    console.error('❌  Cannot reach Directus or token is invalid.')
    console.error('    Check NEXT_PUBLIC_DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN in .env.local')
    console.error('   ', (err as Error).message)
    process.exit(1)
  }

  console.log('📦  Creating/verifying collections…\n')
  await bootstrapPosts()
  console.log()
  await bootstrapPages()
  console.log()
  await bootstrapSiteConfig()

  console.log('\n✅  Bootstrap complete!')
  console.log('\n── Permissions (manual step required for Directus v11) ──────────────')
  console.log('   Directus v11 uses policy-based permissions — not automated here.')
  console.log('   One-time setup in Directus Admin → Settings → Access Policies:')
  console.log()
  console.log('   1. Create policy: "ContentFlow Frontend Read"')
  console.log('      App Access: OFF, Admin Access: OFF')
  console.log()
  console.log('   2. Add Read permissions to that policy:')
  console.log('      posts       — filter: { "published_at": { "_nnull": true } }')
  console.log('      pages       — filter: { "status": { "_eq": "published" } }')
  console.log('      site_config — no filter, all rows, fields: *')
  console.log()
  console.log('   3. Assign the policy to the role whose static token you use as')
  console.log('      NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN')
  console.log()
  console.log('── Next: seed demo data ─────────────────────────────────────────────')
  console.log('   npm run directus:seed\n')
}

main().catch(err => {
  console.error('\n❌  Bootstrap failed:', err.message)
  process.exit(1)
})
