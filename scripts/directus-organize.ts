/**
 * scripts/directus-organize.ts
 *
 * Makes pages_translations editor-friendly by:
 *  1. Adding a hidden `page_slug` field (mirrors the parent page's slug).
 *  2. Populating `page_slug` for every existing row.
 *  3. Creating one group-raw alias field per page type (with a visibility
 *     condition so only the matching group is visible).
 *  4. Moving every content field into its correct group.
 *
 * Also adds missing href fields to site_config so editors can update
 * both the label AND the URL for navbar/footer links.
 *
 * Run AFTER directus:bootstrap (which creates the fields).
 *
 * Usage:  npm run directus:organize
 * Safe to re-run — idempotent.
 */

import 'dotenv/config'

const BASE_URL    = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN

if (!ADMIN_TOKEN) {
  console.error('❌  DIRECTUS_ADMIN_TOKEN not set.')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${ADMIN_TOKEN}`,
}

async function api(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`)
  return data
}

async function fieldExists(collection: string, field: string): Promise<boolean> {
  try { await api('GET', `/fields/${collection}/${field}`); return true } catch { return false }
}

// ── 1. page_slug field ────────────────────────────────────────────────────────
// A hidden string that holds a copy of the parent page's slug.
// Directus field conditions can only reference fields on the SAME collection,
// so this denormalised copy is required for group conditions to work.

async function ensurePageSlugField() {
  console.log('\n📌  Ensuring page_slug field…')

  if (!(await fieldExists('pages_translations', 'page_slug'))) {
    await api('POST', '/fields/pages_translations', {
      field: 'page_slug',
      type:  'string',
      meta: {
        interface: 'input',
        hidden:    true,
        readonly:  true,
        note:      'Auto-populated from parent pages.slug. Used for group visibility conditions.',
        width:     'half',
      },
      schema: { is_nullable: true },
    })
    console.log('  ✓ created pages_translations.page_slug')
  } else {
    console.log('  ✓ page_slug already exists')
  }
}

// ── 2. Populate page_slug ─────────────────────────────────────────────────────
// Fetch every translation row, look up its parent page's slug, then PATCH it.

async function populatePageSlug() {
  console.log('\n🔄  Populating page_slug values…')

  const trRes = await api('GET', '/items/pages_translations?limit=500&fields[]=id,pages_id,page_slug') as
    { data: Array<{ id: number; pages_id: string; page_slug: string | null }> }

  const translations = trRes.data ?? []
  const needsUpdate  = translations.filter(t => !t.page_slug)

  if (needsUpdate.length === 0) {
    console.log('  ✓ All rows already have page_slug')
    return
  }

  // Batch-fetch parent pages (slug lookup)
  const pageIds   = [...new Set(needsUpdate.map(t => t.pages_id))]
  const slugMap   = new Map<string, string>()

  for (const pageId of pageIds) {
    try {
      const res = await api('GET', `/items/pages/${pageId}?fields[]=id,slug`) as { data: { id: string; slug: string } }
      if (res.data?.slug) slugMap.set(res.data.id, res.data.slug)
    } catch { /* skip */ }
  }

  let updated = 0
  for (const tr of needsUpdate) {
    const slug = slugMap.get(tr.pages_id)
    if (!slug) continue
    try {
      await api('PATCH', `/items/pages_translations/${tr.id}?fields[]=id`, { page_slug: slug })
      updated++
    } catch (e) {
      console.warn(`  ⚠  row ${tr.id}: ${(e as Error).message}`)
    }
  }
  console.log(`  ✓ Updated ${updated}/${needsUpdate.length} rows`)
}

// ── 3. Section groups with conditions ─────────────────────────────────────────
// Each group is a group-raw alias field that is hidden unless page_slug matches.
// All content fields for that page type are moved inside the group.

// condition rule: hide this group when page_slug is set AND not one of the allowed slugs
function hideCondition(allowedSlugs: string[]) {
  return {
    name:    'hide-for-other-pages',
    rule:    { _and: [{ page_slug: { _nnull: true } }, { page_slug: { _nin: allowedSlugs } }] },
    hidden:  true,
    options: {},
  }
}

const GROUPS: {
  field:    string
  label:    string
  icon:     string
  slugs:    string[]
  fields:   string[]
}[] = [
  {
    field: '_group_home',
    label: '🏠 Home Page',
    icon:  'home',
    slugs: ['home'],
    fields: [
      '_div_hero',
      'hero_heading', 'hero_subheading', 'hero_badge', 'hero_community_text',
      'hero_primary_cta_label', 'hero_primary_cta_href',
      'hero_secondary_cta_label', 'hero_secondary_cta_href',
      '_div_featured',
      'featured_posts_heading', 'featured_posts_subheading', 'featured_posts_view_all', 'featured_posts_view_all_href',
      '_div_recent',
      'recent_posts_heading', 'recent_posts_subheading', 'recent_posts_view_all', 'recent_posts_view_all_href',
      '_div_cta',
      'cta_heading', 'cta_body', 'cta_primary_label', 'cta_primary_href',
    ],
  },
  {
    field: '_group_auth',
    label: '🔐 Auth Pages (Login / Signup)',
    icon:  'lock',
    slugs: ['login', 'signup'],
    fields: [
      '_div_auth_hero',
      'auth_hero_badge', 'auth_hero_headline', 'auth_hero_footer_note',
      '_div_auth_form',
      'auth_heading', 'auth_google_label', 'auth_divider_label',
      'auth_name_label', 'auth_name_placeholder',
      'auth_email_label', 'auth_email_placeholder',
      'auth_password_label', 'auth_password_placeholder',
      'auth_submit_label',
      'auth_footer_text', 'auth_footer_link_label', 'auth_footer_link_href',
    ],
  },
  {
    field: '_group_posts',
    label: '📄 Posts Page',
    icon:  'article',
    slugs: ['posts'],
    fields: [
      '_div_posts',
      'posts_heading', 'posts_subheading', 'posts_api_badge',
      'posts_my_label', 'posts_published_label', 'posts_drafts_label',
      'posts_sync_label', 'posts_new_label', 'posts_search_placeholder',
      'posts_col_title', 'posts_col_status', 'posts_col_tags', 'posts_col_modified',
      'posts_empty_title', 'posts_empty_body', 'posts_empty_cta',
      'posts_load_more',
      'posts_view_label', 'posts_edit_label', 'posts_delete_label',
      'posts_delete_dialog_title', 'posts_delete_dialog_body',
      'posts_delete_confirm', 'posts_delete_cancel',
    ],
  },
  {
    field: '_group_billing',
    label: '💳 Billing Page',
    icon:  'credit_card',
    slugs: ['billing'],
    fields: [
      '_div_billing',
      'billing_heading', 'billing_subheading',
      'billing_current_plan_label', 'billing_active_badge', 'billing_cancelling_badge', 'billing_free_badge',
      'billing_manage_label', 'billing_cancel_label', 'billing_reactivate_label', 'billing_upgrade_label',
      'billing_cancelling_note',
      'billing_usage_heading', 'billing_posts_label', 'billing_api_label', 'billing_storage_label', 'billing_seats_label',
      'billing_plans_heading',
      'billing_free_name', 'billing_free_tagline', 'billing_free_price',
      'billing_pro_name', 'billing_pro_tagline', 'billing_pro_badge',
      'billing_upgrade_cta', 'billing_downgrade_cta', 'billing_current_plan_btn',
      'billing_stripe_note', 'billing_webhook_note',
    ],
  },
  {
    field: '_group_billing_success',
    label: '✅ Billing Success Page',
    icon:  'check_circle',
    slugs: ['billing-success'],
    fields: [
      '_div_billing_success',
      'billing_success_heading', 'billing_success_subheading', 'billing_success_body',
      'billing_success_primary_label', 'billing_success_primary_href',
      'billing_success_secondary_label', 'billing_success_secondary_href',
    ],
  },
  {
    field: '_group_settings',
    label: '⚙️ Settings Page',
    icon:  'settings',
    slugs: ['settings'],
    fields: [
      '_div_settings',
      'settings_heading', 'settings_subheading',
      'settings_upload_photo_label',
      'settings_display_name_label', 'settings_email_label', 'settings_email_helper',
      'settings_bio_label', 'settings_bio_placeholder',
      'settings_website_label', 'settings_website_placeholder', 'settings_website_error',
      'settings_save_label', 'settings_discard_label',
      'settings_danger_heading', 'settings_danger_body', 'settings_danger_warning', 'settings_delete_label',
    ],
  },
  {
    field: '_group_admin',
    label: '🛡️ Admin Page',
    icon:  'admin_panel_settings',
    slugs: ['admin'],
    fields: [
      '_div_admin',
      'admin_heading', 'admin_subheading',
      'admin_total_users_label', 'admin_pro_label', 'admin_free_label',
      'admin_col_user', 'admin_col_plan', 'admin_col_role', 'admin_col_joined', 'admin_empty_label',
      'admin_invite_heading', 'admin_invite_form_title',
      'admin_invite_email_label', 'admin_invite_email_placeholder',
      'admin_invite_message_label', 'admin_invite_send_label',
    ],
  },
  {
    field: '_group_analytics',
    label: '📊 Analytics Page',
    icon:  'analytics',
    slugs: ['analytics'],
    fields: [
      '_div_analytics',
      'analytics_heading', 'analytics_subheading',
      'analytics_events_label', 'analytics_users_label',
      'analytics_empty_title', 'analytics_empty_body',
      'analytics_refresh_label', 'analytics_prev_label', 'analytics_next_label',
    ],
  },
]

async function ensureGroups() {
  console.log('\n📦  Ensuring section group fields…')

  for (const group of GROUPS) {
    if (!(await fieldExists('pages_translations', group.field))) {
      await api('POST', '/fields/pages_translations', {
        field: group.field,
        type:  'alias',
        meta: {
          interface:  'group-raw',
          special:    ['group', 'alias', 'no-data'],
          width:      'full',
          options:    { showHeader: true, headerIcon: group.icon, headerColor: null },
          note:       group.label,
          conditions: [hideCondition(group.slugs)],
        },
        schema: null,
      })
      console.log(`  ✓ created group: ${group.field}`)
    } else {
      // Update conditions in case slugs changed
      await api('PATCH', `/fields/pages_translations/${group.field}`, {
        meta: { conditions: [hideCondition(group.slugs)] },
      })
      console.log(`  ✓ updated conditions: ${group.field}`)
    }
  }
}

// ── 4. Move fields into groups ────────────────────────────────────────────────

async function assignFieldGroups() {
  console.log('\n🔗  Assigning fields to groups…')

  for (const group of GROUPS) {
    for (const fieldName of group.fields) {
      if (!(await fieldExists('pages_translations', fieldName))) continue
      try {
        await api('PATCH', `/fields/pages_translations/${fieldName}`, {
          meta: { group: group.field },
        })
        process.stdout.write('.')
      } catch (e) {
        console.warn(`\n  ⚠  ${fieldName}: ${(e as Error).message}`)
      }
    }
  }
  console.log('\n  ✓ done')
}

// ── 5. Add missing href fields to site_config ─────────────────────────────────
// Navbar login/signup/signout currently only have label fields.
// Add href counterparts so editors can update both text AND destination URL.

async function ensureSiteConfigHrefs() {
  console.log('\n🔗  Ensuring site_config href fields…')

  const hrefFields: { field: string; note: string }[] = [
    { field: 'navbar_login_href',   note: 'Login page href (default: /login)' },
    { field: 'navbar_signup_href',  note: 'Sign up page href (default: /signup)' },
    { field: 'navbar_signout_href', note: 'Sign out redirect href (default: /)' },
    { field: 'footer_privacy_href', note: 'Privacy policy page href' },
    { field: 'footer_terms_href',   note: 'Terms of service page href' },
  ]

  for (const { field, note } of hrefFields) {
    if (!(await fieldExists('site_config', field))) {
      await api('POST', '/fields/site_config', {
        field,
        type: 'string',
        meta: { interface: 'input', width: 'half', note },
        schema: { is_nullable: true },
      })
      console.log(`  ✓ created site_config.${field}`)
    } else {
      console.log(`  ✓ exists: site_config.${field}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  ContentFlow — organize Directus fields')
  console.log(`    URL: ${BASE_URL}\n`)

  try { await api('GET', '/collections'); console.log('✓  Directus reachable\n') }
  catch { console.error('❌  Cannot reach Directus'); process.exit(1) }

  await ensurePageSlugField()
  await populatePageSlug()
  await ensureGroups()
  await assignFieldGroups()
  await ensureSiteConfigHrefs()

  console.log('\n✅  Done!')
  console.log('   Open any pages_translations row in Directus — you should now')
  console.log('   see only the fields relevant to that specific page.\n')
}

main().catch(err => {
  console.error('\n❌  Failed:', err.message)
  process.exit(1)
})
