/**
 * scripts/migrate-to-fields.ts
 *
 * Migrates ContentFlow from JSON blob sections to individual Directus fields.
 *
 * What it does:
 *   1. Adds all new string/text fields to pages_translations
 *   2. Adds all new string fields to site_config
 *   3. Reads existing pages_translations rows and populates the new fields
 *      from the old sections JSON (backward-compat migration)
 *   4. Reads existing site_config and populates new fields from old JSON blobs
 *   5. Hides the old sections / navbar_config / footer_config / sidebar_config
 *      fields in the Directus UI (does NOT delete them — safe rollback)
 *
 * Safe to re-run — fieldExists checks prevent duplicates.
 *
 * Usage:
 *   npm run directus:migrate
 *   (add "directus:migrate": "dotenv -e .env.local -- tsx scripts/migrate-to-fields.ts" to package.json)
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
    const errMsg = JSON.stringify((data as { errors?: unknown })?.errors ?? data)
    throw new Error(`${method} ${path} → ${res.status}: ${errMsg}`)
  }
  return data
}

async function fieldExists(collection: string, field: string): Promise<boolean> {
  try { await api('GET', `/fields/${collection}/${field}`); return true } catch { return false }
}

function str(val: unknown): string | null {
  if (val === null || val === undefined) return null
  return String(val)
}

function txt(val: unknown): string | null {
  if (val === null || val === undefined) return null
  return String(val)
}

// ── Field definitions ─────────────────────────────────────────────────────────

function stringField(field: string, note?: string, width: 'half' | 'full' = 'full') {
  return {
    field,
    payload: {
      field, type: 'string',
      meta: { interface: 'input', width, note: note ?? null },
      schema: { is_nullable: true },
    },
  }
}

function textField(field: string, note?: string) {
  return {
    field,
    payload: {
      field, type: 'text',
      meta: { interface: 'input-multiline', width: 'full', note: note ?? null },
      schema: { is_nullable: true },
    },
  }
}

function dividerField(field: string, label: string) {
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

// ── pages_translations fields ─────────────────────────────────────────────────

const PAGE_TRANSLATION_FIELDS = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  dividerField('_div_hero', '🦸 Hero Section'),
  stringField('hero_heading',             'Main hero heading'),
  textField  ('hero_subheading',          'Hero subheading / description'),
  stringField('hero_badge',               'Badge label above heading', 'half'),
  stringField('hero_community_text',      'Social proof text below CTAs', 'half'),
  stringField('hero_primary_cta_label',   'Primary CTA button label', 'half'),
  stringField('hero_primary_cta_href',    'Primary CTA href', 'half'),
  stringField('hero_secondary_cta_label', 'Secondary CTA button label', 'half'),
  stringField('hero_secondary_cta_href',  'Secondary CTA href', 'half'),

  // ── Featured posts ─────────────────────────────────────────────────────────
  dividerField('_div_featured', '📌 Featured Posts Section'),
  stringField('featured_posts_heading',    'Featured posts heading', 'half'),
  stringField('featured_posts_subheading', 'Featured posts subheading', 'half'),
  stringField('featured_posts_view_all',   '"View all" link label', 'half'),

  // ── Recent posts ───────────────────────────────────────────────────────────
  dividerField('_div_recent', '🕐 Recent Posts Section'),
  stringField('recent_posts_heading',    'Recent posts heading', 'half'),
  stringField('recent_posts_subheading', 'Recent posts subheading', 'half'),
  stringField('recent_posts_view_all',   '"View all" link label', 'half'),

  // ── CTA section ────────────────────────────────────────────────────────────
  dividerField('_div_cta', '📢 CTA Section'),
  stringField('cta_heading',       'CTA heading', 'half'),
  textField  ('cta_body',          'CTA body text'),
  stringField('cta_primary_label', 'CTA button label', 'half'),
  stringField('cta_primary_href',  'CTA button href', 'half'),

  // ── Auth hero ──────────────────────────────────────────────────────────────
  dividerField('_div_auth_hero', '🔐 Auth Hero Section (login/signup left panel)'),
  stringField('auth_hero_badge',       'Auth hero badge text', 'half'),
  stringField('auth_hero_headline',    'Auth hero headline', 'half'),
  textField  ('auth_hero_footer_note', 'Auth hero footer note'),

  // ── Auth form ──────────────────────────────────────────────────────────────
  dividerField('_div_auth_form', '📝 Auth Form Section'),
  stringField('auth_heading',              'Form heading', 'half'),
  stringField('auth_google_label',         'Google OAuth button label', 'half'),
  stringField('auth_divider_label',        'Divider text (e.g. "or")', 'half'),
  stringField('auth_name_label',           'Name field label', 'half'),
  stringField('auth_name_placeholder',     'Name field placeholder', 'half'),
  stringField('auth_email_label',          'Email field label', 'half'),
  stringField('auth_email_placeholder',    'Email field placeholder', 'half'),
  stringField('auth_password_label',       'Password field label', 'half'),
  stringField('auth_password_placeholder', 'Password field placeholder', 'half'),
  stringField('auth_submit_label',         'Submit button label', 'half'),
  stringField('auth_footer_text',          'Footer text', 'half'),
  stringField('auth_footer_link_label',    'Footer link label', 'half'),
  stringField('auth_footer_link_href',     'Footer link href', 'half'),

  // ── Posts page ─────────────────────────────────────────────────────────────
  dividerField('_div_posts', '📄 Posts Page'),
  stringField('posts_heading',             'Posts page heading', 'half'),
  stringField('posts_subheading',          'Posts page subheading', 'half'),
  stringField('posts_api_badge',           'API badge label', 'half'),
  stringField('posts_my_label',            '"My posts" stat label', 'half'),
  stringField('posts_published_label',     '"Published" stat label', 'half'),
  stringField('posts_drafts_label',        '"Drafts" stat label', 'half'),
  stringField('posts_sync_label',          'Sync button label', 'half'),
  stringField('posts_new_label',           'New post button label', 'half'),
  stringField('posts_search_placeholder',  'Search placeholder', 'half'),
  stringField('posts_col_title',           'Table: Title column header', 'half'),
  stringField('posts_col_status',          'Table: Status column header', 'half'),
  stringField('posts_col_tags',            'Table: Tags column header', 'half'),
  stringField('posts_col_modified',        'Table: Last modified column header', 'half'),
  stringField('posts_empty_title',         'Empty state title', 'half'),
  textField  ('posts_empty_body',          'Empty state body'),
  stringField('posts_empty_cta',           'Empty state CTA label', 'half'),
  stringField('posts_load_more',           '"Load more" button label', 'half'),
  stringField('posts_view_label',          'Row action: View', 'half'),
  stringField('posts_edit_label',          'Row action: Edit', 'half'),
  stringField('posts_delete_label',        'Row action: Delete', 'half'),
  stringField('posts_delete_dialog_title', 'Delete dialog title', 'half'),
  textField  ('posts_delete_dialog_body',  'Delete dialog body'),
  stringField('posts_delete_confirm',      'Delete confirm button', 'half'),
  stringField('posts_delete_cancel',       'Delete cancel button', 'half'),

  // ── Billing page ───────────────────────────────────────────────────────────
  dividerField('_div_billing', '💳 Billing Page'),
  stringField('billing_heading',            'Billing page heading', 'half'),
  stringField('billing_subheading',         'Billing page subheading', 'half'),
  stringField('billing_current_plan_label', '"Current plan" label', 'half'),
  stringField('billing_active_badge',       '"Active" badge label', 'half'),
  stringField('billing_cancelling_badge',   '"Cancelling" badge label', 'half'),
  stringField('billing_free_badge',         '"Free" badge label', 'half'),
  stringField('billing_manage_label',       '"Manage" button label', 'half'),
  stringField('billing_cancel_label',       '"Cancel" button label', 'half'),
  stringField('billing_reactivate_label',   '"Reactivate" button label', 'half'),
  stringField('billing_upgrade_label',      '"Upgrade" button label', 'half'),
  textField  ('billing_cancelling_note',    'Cancelling note text'),
  stringField('billing_usage_heading',      'Usage section heading', 'half'),
  stringField('billing_posts_label',        'Posts usage label', 'half'),
  stringField('billing_api_label',          'API usage label', 'half'),
  stringField('billing_storage_label',      'Storage usage label', 'half'),
  stringField('billing_seats_label',        'Seats usage label', 'half'),
  stringField('billing_plans_heading',      'Plans section heading', 'half'),
  stringField('billing_free_name',          'Free plan name', 'half'),
  stringField('billing_free_tagline',       'Free plan tagline', 'half'),
  stringField('billing_free_price',         'Free plan price display', 'half'),
  stringField('billing_pro_name',           'Pro plan name', 'half'),
  stringField('billing_pro_tagline',        'Pro plan tagline', 'half'),
  stringField('billing_pro_badge',          'Pro plan badge', 'half'),
  stringField('billing_upgrade_cta',        'Upgrade CTA label', 'half'),
  stringField('billing_downgrade_cta',      'Downgrade CTA label', 'half'),
  stringField('billing_current_plan_btn',   '"Current plan" button label', 'half'),
  stringField('billing_stripe_note',        'Stripe note text', 'half'),
  stringField('billing_webhook_note',       'Webhook note text', 'half'),

  // ── Billing success ────────────────────────────────────────────────────────
  dividerField('_div_billing_success', '✅ Billing Success Page'),
  stringField('billing_success_heading',         'Success heading', 'half'),
  stringField('billing_success_subheading',      'Success subheading', 'half'),
  textField  ('billing_success_body',            'Success body text'),
  stringField('billing_success_primary_label',   'Primary action label', 'half'),
  stringField('billing_success_primary_href',    'Primary action href', 'half'),
  stringField('billing_success_secondary_label', 'Secondary action label', 'half'),
  stringField('billing_success_secondary_href',  'Secondary action href', 'half'),

  // ── Settings page ──────────────────────────────────────────────────────────
  dividerField('_div_settings', '⚙️ Settings Page'),
  stringField('settings_heading',              'Settings page heading', 'half'),
  stringField('settings_subheading',           'Settings page subheading', 'half'),
  stringField('settings_upload_photo_label',   'Upload photo label', 'half'),
  stringField('settings_display_name_label',   'Display name field label', 'half'),
  stringField('settings_email_label',          'Email field label', 'half'),
  stringField('settings_email_helper',         'Email helper text', 'half'),
  stringField('settings_bio_label',            'Bio field label', 'half'),
  textField  ('settings_bio_placeholder',      'Bio field placeholder'),
  stringField('settings_website_label',        'Website field label', 'half'),
  stringField('settings_website_placeholder',  'Website field placeholder', 'half'),
  stringField('settings_website_error',        'Website validation error', 'half'),
  stringField('settings_save_label',           'Save button label', 'half'),
  stringField('settings_discard_label',        'Discard button label', 'half'),
  stringField('settings_danger_heading',       'Danger zone heading', 'half'),
  textField  ('settings_danger_body',          'Danger zone body text'),
  stringField('settings_danger_warning',       'Danger zone warning text', 'half'),
  stringField('settings_delete_label',         'Delete account button label', 'half'),

  // ── Admin page ─────────────────────────────────────────────────────────────
  dividerField('_div_admin', '🛡️ Admin Page'),
  stringField('admin_heading',                   'Admin page heading', 'half'),
  stringField('admin_subheading',                'Admin page subheading', 'half'),
  stringField('admin_total_users_label',         '"Total users" label', 'half'),
  stringField('admin_pro_label',                 '"Pro" label', 'half'),
  stringField('admin_free_label',                '"Free" label', 'half'),
  stringField('admin_col_user',                  'Table: User column header', 'half'),
  stringField('admin_col_plan',                  'Table: Plan column header', 'half'),
  stringField('admin_col_role',                  'Table: Role column header', 'half'),
  stringField('admin_col_joined',                'Table: Joined column header', 'half'),
  stringField('admin_empty_label',               'Empty users label', 'half'),
  stringField('admin_invite_heading',            'Invite section heading', 'half'),
  stringField('admin_invite_form_title',         'Invite form title', 'half'),
  stringField('admin_invite_email_label',        'Invite email label', 'half'),
  stringField('admin_invite_email_placeholder',  'Invite email placeholder', 'half'),
  stringField('admin_invite_message_label',      'Invite message label', 'half'),
  stringField('admin_invite_send_label',         'Invite send button label', 'half'),

  // ── Analytics page ─────────────────────────────────────────────────────────
  dividerField('_div_analytics', '📊 Analytics Page'),
  stringField('analytics_heading',        'Analytics heading', 'half'),
  stringField('analytics_subheading',     'Analytics subheading', 'half'),
  stringField('analytics_events_label',   'Events count label', 'half'),
  stringField('analytics_users_label',    'Unique users label', 'half'),
  stringField('analytics_empty_title',    'Empty state title', 'half'),
  textField  ('analytics_empty_body',     'Empty state body'),
  stringField('analytics_refresh_label',  'Refresh button label', 'half'),
  stringField('analytics_prev_label',     '"Previous" pagination label', 'half'),
  stringField('analytics_next_label',     '"Next" pagination label', 'half'),
]

// ── site_config fields ────────────────────────────────────────────────────────

const SITE_CONFIG_FIELDS = [
  // ── Navbar ─────────────────────────────────────────────────────────────────
  dividerField('_div_navbar', '🔝 Navbar'),
  stringField('navbar_brand_name',       'Brand / logo name', 'half'),
  stringField('navbar_cta_label_en',     'CTA button label (English)', 'half'),
  stringField('navbar_cta_label_hi',     'CTA button label (Hindi)', 'half'),
  stringField('navbar_cta_label_kn',     'CTA button label (Kannada)', 'half'),
  stringField('navbar_cta_href',         'CTA button href', 'half'),
  stringField('navbar_login_label_en',   'Login label (English)', 'half'),
  stringField('navbar_login_label_hi',   'Login label (Hindi)', 'half'),
  stringField('navbar_login_label_kn',   'Login label (Kannada)', 'half'),
  stringField('navbar_signup_label_en',  'Sign up label (English)', 'half'),
  stringField('navbar_signup_label_hi',  'Sign up label (Hindi)', 'half'),
  stringField('navbar_signup_label_kn',  'Sign up label (Kannada)', 'half'),
  stringField('navbar_signout_label_en', 'Sign out label (English)', 'half'),
  stringField('navbar_signout_label_hi', 'Sign out label (Hindi)', 'half'),
  stringField('navbar_signout_label_kn', 'Sign out label (Kannada)', 'half'),

  // ── Footer ─────────────────────────────────────────────────────────────────
  dividerField('_div_footer', '🦶 Footer'),
  stringField('footer_brand_name',      'Footer brand name', 'half'),
  stringField('footer_tagline_en',      'Tagline (English)', 'half'),
  stringField('footer_tagline_hi',      'Tagline (Hindi)', 'half'),
  stringField('footer_tagline_kn',      'Tagline (Kannada)', 'half'),
  stringField('footer_copyright_en',    'Copyright text (English)', 'half'),
  stringField('footer_copyright_hi',    'Copyright text (Hindi)', 'half'),
  stringField('footer_copyright_kn',    'Copyright text (Kannada)', 'half'),

  // ── Sidebar ────────────────────────────────────────────────────────────────
  dividerField('_div_sidebar', '📌 Sidebar'),
  stringField('sidebar_brand_name',     'Sidebar brand name', 'half'),
  stringField('sidebar_brand_subtitle', 'Sidebar brand subtitle', 'half'),
  stringField('sidebar_status_text',    'Status text (e.g. "All systems operational")', 'half'),
  stringField('sidebar_status_badge',   'Status badge (e.g. "Live")', 'half'),
]

// ── Step 1: create fields ─────────────────────────────────────────────────────

async function addFieldsToCollection(
  collection: string,
  fields: { field: string; payload: unknown }[],
) {
  let created = 0
  for (const { field, payload } of fields) {
    // Skip dividers that already exist (re-run safety)
    const exists = await fieldExists(collection, field)
    if (!exists) {
      try {
        await api('POST', `/fields/${collection}`, payload)
        console.log(`  ✓ ${collection}.${field}`)
        created++
      } catch (err) {
        console.warn(`  ⚠ ${collection}.${field} — ${(err as Error).message}`)
      }
    }
  }
  if (created === 0) console.log(`  (all fields already exist)`)
  return created
}

// ── Step 2: migrate existing data ─────────────────────────────────────────────

async function migratePageTranslations() {
  console.log('\n📦  Migrating pages_translations data…')

  // Fetch all translation rows with sections JSON
  const res = await api('GET', '/items/pages_translations?limit=200&fields=*') as {
    data: Array<Record<string, unknown>>
  }
  const rows = res.data ?? []
  console.log(`  Found ${rows.length} translation rows`)

  let migrated = 0
  for (const row of rows) {
    const id = row.id as number
    const sections = (row.sections as unknown[]) ?? []

    // Build update payload by extracting from sections JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, string | null> = {}

    for (const section of sections) {
      const s = section as Record<string, unknown>
      const type = (s._type ?? s.sectionType) as string

      if (type === 'heroSection' || s.sectionType === 'hero') {
        const d = (s.hero ?? s) as Record<string, unknown>
        update.hero_heading             = str(d.heading)
        update.hero_subheading          = str(d.subheading)
        update.hero_badge               = str(d.badge)
        update.hero_community_text      = str(d.communityText)
        const pc = d.primaryCta as Record<string, unknown> | undefined
        const sc = d.secondaryCta as Record<string, unknown> | undefined
        update.hero_primary_cta_label   = str(pc?.label)
        update.hero_primary_cta_href    = str(pc?.href)
        update.hero_secondary_cta_label = str(sc?.label)
        update.hero_secondary_cta_href  = str(sc?.href)
      }

      if (type === 'featuredPostsSection' || s.sectionType === 'featuredPosts') {
        const d = (s.featuredPosts ?? s) as Record<string, unknown>
        update.featured_posts_heading    = str(d.heading)
        update.featured_posts_subheading = str(d.subheading)
        update.featured_posts_view_all   = str(d.viewAllLabel)
      }

      if (type === 'recentPostsSection' || s.sectionType === 'recentPosts') {
        const d = (s.recentPosts ?? s) as Record<string, unknown>
        update.recent_posts_heading    = str(d.heading)
        update.recent_posts_subheading = str(d.subheading)
        update.recent_posts_view_all   = str(d.viewAllLabel)
      }

      if (type === 'ctaSection' || s.sectionType === 'cta') {
        const d = (s.cta ?? s) as Record<string, unknown>
        update.cta_heading       = str(d.heading)
        update.cta_body          = txt(d.body)
        const pb = d.primaryButton as Record<string, unknown> | undefined
        update.cta_primary_label = str(pb?.label)
        update.cta_primary_href  = str(pb?.href)
      }

      if (s.sectionType === 'authHero') {
        const d = (s.authHero ?? s) as Record<string, unknown>
        update.auth_hero_badge       = str(d.badge)
        update.auth_hero_headline    = str(d.headline)
        update.auth_hero_footer_note = txt(d.footerNote)
      }

      if (s.sectionType === 'authForm' || type === 'authSection') {
        const d = (s.authForm ?? s) as Record<string, unknown>
        update.auth_heading              = str(d.heading)
        update.auth_google_label         = str(d.googleLabel)
        update.auth_divider_label        = str(d.dividerLabel)
        update.auth_name_label           = str(d.nameLabel)
        update.auth_name_placeholder     = str(d.namePlaceholder)
        update.auth_email_label          = str(d.emailLabel)
        update.auth_email_placeholder    = str(d.emailPlaceholder)
        update.auth_password_label       = str(d.passwordLabel)
        update.auth_password_placeholder = str(d.passwordPlaceholder)
        update.auth_submit_label         = str(d.submitLabel)
        update.auth_footer_text          = str(d.footerText)
        update.auth_footer_link_label    = str(d.footerLinkLabel)
        update.auth_footer_link_href     = str(d.footerLinkHref)
      }

      if (s.sectionType === 'postsHeader') {
        const d = (s.postsHeader ?? s) as Record<string, unknown>
        update.posts_heading    = str(d.heading)
        update.posts_subheading = str(d.subheading)
        update.posts_api_badge  = str(d.apiBadgeLabel)
      }

      if (s.sectionType === 'postsStats') {
        const d = (s.postsStats ?? s) as Record<string, unknown>
        update.posts_my_label        = str(d.myPostsLabel)
        update.posts_published_label = str(d.publishedLabel)
        update.posts_drafts_label    = str(d.draftsLabel)
      }

      if (s.sectionType === 'postsActions') {
        const d = (s.postsActions ?? s) as Record<string, unknown>
        update.posts_sync_label = str(d.syncButtonLabel)
        update.posts_new_label  = str(d.newPostButtonLabel)
      }

      if (s.sectionType === 'postsSearch') {
        const d = (s.postsSearch ?? s) as Record<string, unknown>
        update.posts_search_placeholder = str(d.searchPlaceholder)
      }

      if (s.sectionType === 'postsTable') {
        const d = (s.postsTable ?? s) as Record<string, unknown>
        update.posts_col_title           = str(d.colTitle)
        update.posts_col_status          = str(d.colStatus)
        update.posts_col_tags            = str(d.colTags)
        update.posts_col_modified        = str(d.colLastModified)
        update.posts_empty_title         = str(d.emptyTitle)
        update.posts_empty_body          = txt(d.emptyBody)
        update.posts_empty_cta           = str(d.emptyCtaLabel)
        update.posts_load_more           = str(d.loadMoreLabel)
        update.posts_view_label          = str(d.viewPostLabel)
        update.posts_edit_label          = str(d.editPostLabel)
        update.posts_delete_label        = str(d.deletePostLabel)
        update.posts_delete_dialog_title = str(d.deleteDialogTitle)
        update.posts_delete_dialog_body  = txt(d.deleteDialogBody)
        update.posts_delete_confirm      = str(d.deleteDialogConfirmLabel)
        update.posts_delete_cancel       = str(d.deleteDialogCancelLabel)
      }

      if (s.sectionType === 'billingHeader') {
        const d = (s.billingHeader ?? s) as Record<string, unknown>
        update.billing_heading    = str(d.heading)
        update.billing_subheading = str(d.subheading)
      }

      if (s.sectionType === 'billingCurrentPlan') {
        const d = (s.billingCurrentPlan ?? s) as Record<string, unknown>
        update.billing_current_plan_label = str(d.currentPlanLabel)
        update.billing_active_badge       = str(d.activeBadgeLabel)
        update.billing_cancelling_badge   = str(d.cancellingBadgeLabel)
        update.billing_free_badge         = str(d.freeTierBadgeLabel)
        update.billing_manage_label       = str(d.manageLabel)
        update.billing_cancel_label       = str(d.cancelLabel)
        update.billing_reactivate_label   = str(d.reactivateLabel)
        update.billing_upgrade_label      = str(d.upgradeLabel)
        update.billing_cancelling_note    = txt(d.cancellingNote)
      }

      if (s.sectionType === 'billingUsage') {
        const d = (s.billingUsage ?? s) as Record<string, unknown>
        update.billing_usage_heading   = str(d.usageHeading)
        update.billing_posts_label     = str(d.postsUsageLabel)
        update.billing_api_label       = str(d.apiUsageLabel)
        update.billing_storage_label   = str(d.storageUsageLabel)
        update.billing_seats_label     = str(d.seatsUsageLabel)
      }

      if (s.sectionType === 'billingPlansGrid') {
        const d = (s.billingPlansGrid ?? s) as Record<string, unknown>
        update.billing_plans_heading    = str(d.plansHeading)
        update.billing_free_name        = str(d.freePlanName)
        update.billing_free_tagline     = str(d.freePlanTagline)
        update.billing_free_price       = str(d.freePlanPrice)
        update.billing_pro_name         = str(d.proPlanName)
        update.billing_pro_tagline      = str(d.proPlanTagline)
        update.billing_pro_badge        = str(d.proPlanBadge)
        update.billing_upgrade_cta      = str(d.upgradeLabel)
        update.billing_downgrade_cta    = str(d.downgradeLabel)
        update.billing_current_plan_btn = str(d.currentPlanButtonLabel)
      }

      if (s.sectionType === 'billingFooter') {
        const d = (s.billingFooter ?? s) as Record<string, unknown>
        update.billing_stripe_note  = str(d.stripeNote)
        update.billing_webhook_note = str(d.webhookNote)
      }

      if (s.sectionType === 'billingSuccessHero') {
        const d = (s.billingSuccessHero ?? s) as Record<string, unknown>
        update.billing_success_heading    = str(d.heading)
        update.billing_success_subheading = str(d.subheading)
        update.billing_success_body       = txt(d.body)
      }

      if (s.sectionType === 'billingSuccessActions') {
        const d = (s.billingSuccessActions ?? s) as Record<string, unknown>
        update.billing_success_primary_label   = str(d.primaryLabel)
        update.billing_success_primary_href    = str(d.primaryHref)
        update.billing_success_secondary_label = str(d.secondaryLabel)
        update.billing_success_secondary_href  = str(d.secondaryHref)
      }

      if (s.sectionType === 'settingsHeader') {
        const d = (s.settingsHeader ?? s) as Record<string, unknown>
        update.settings_heading    = str(d.heading)
        update.settings_subheading = str(d.subheading)
      }

      if (s.sectionType === 'settingsInfo') {
        const d = (s.settingsInfo ?? s) as Record<string, unknown>
        update.settings_upload_photo_label = str(d.uploadPhotoLabel)
      }

      if (s.sectionType === 'settingsForm') {
        const d = (s.settingsForm ?? s) as Record<string, unknown>
        update.settings_display_name_label  = str(d.displayNameLabel)
        update.settings_email_label         = str(d.emailLabel)
        update.settings_email_helper        = str(d.emailHelperText)
        update.settings_bio_label           = str(d.bioLabel)
        update.settings_bio_placeholder     = txt(d.bioPlaceholder)
        update.settings_website_label       = str(d.websiteLabel)
        update.settings_website_placeholder = str(d.websitePlaceholder)
        update.settings_website_error       = str(d.websiteErrorText)
        update.settings_save_label          = str(d.saveLabel)
        update.settings_discard_label       = str(d.discardLabel)
      }

      if (s.sectionType === 'settingsDanger') {
        const d = (s.settingsDanger ?? s) as Record<string, unknown>
        update.settings_danger_heading = str(d.heading)
        update.settings_danger_body    = txt(d.body)
        update.settings_danger_warning = str(d.warningText)
        update.settings_delete_label   = str(d.deleteLabel)
      }

      if (s.sectionType === 'admin') {
        const d = (s.admin ?? s) as Record<string, unknown>
        update.admin_heading                  = str(d.heading)
        update.admin_subheading               = str(d.subheading)
        update.admin_total_users_label        = str(d.totalUsersLabel)
        update.admin_pro_label                = str(d.proLabel)
        update.admin_free_label               = str(d.freeLabel)
        update.admin_col_user                 = str(d.colUser)
        update.admin_col_plan                 = str(d.colPlan)
        update.admin_col_role                 = str(d.colRole)
        update.admin_col_joined               = str(d.colJoined)
        update.admin_empty_label              = str(d.emptyLabel)
        update.admin_invite_heading           = str(d.inviteSectionHeading)
        update.admin_invite_form_title        = str(d.inviteFormTitle)
        update.admin_invite_email_label       = str(d.inviteEmailLabel)
        update.admin_invite_email_placeholder = str(d.inviteEmailPlaceholder)
        update.admin_invite_message_label     = str(d.inviteMessageLabel)
        update.admin_invite_send_label        = str(d.inviteSendLabel)
      }

      if (s.sectionType === 'analytics') {
        const d = (s.analytics ?? s) as Record<string, unknown>
        update.analytics_heading       = str(d.heading)
        update.analytics_subheading    = str(d.subheading)
        update.analytics_events_label  = str(d.eventsLabel)
        update.analytics_users_label   = str(d.usersLabel)
        update.analytics_empty_title   = str(d.emptyTitle)
        update.analytics_empty_body    = txt(d.emptyBody)
        update.analytics_refresh_label = str(d.refreshLabel)
        update.analytics_prev_label    = str(d.prevLabel)
        update.analytics_next_label    = str(d.nextLabel)
      }
    }

    // Only patch if we extracted something
    const nonNull = Object.values(update).filter(v => v !== null)
    if (nonNull.length > 0) {
      await api('PATCH', `/items/pages_translations/${id}`, update)
      migrated++
      console.log(`  ✓ row ${id} (${row.languages_code}) — ${nonNull.length} fields populated`)
    }
  }

  console.log(`  Migrated ${migrated}/${rows.length} rows`)
}

async function migrateSiteConfig() {
  console.log('\n📦  Migrating site_config data…')

  const res = await api('GET', '/items/site_config/site-config') as { data: Record<string, unknown> }
  const cfg = res.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navbar = (cfg.navbar_config ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const footer = (cfg.footer_config ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sidebar = (cfg.sidebar_config ?? {}) as Record<string, any>

  function ml(val: unknown, lang: string): string | null {
    if (!val) return null
    if (typeof val === 'string') return val
    return str((val as Record<string, unknown>)[lang])
  }

  const update: Record<string, string | null> = {
    navbar_brand_name:       str(navbar.brandName),
    navbar_cta_label_en:     ml(navbar.ctaButton?.label, 'en'),
    navbar_cta_label_hi:     ml(navbar.ctaButton?.label, 'hi'),
    navbar_cta_label_kn:     ml(navbar.ctaButton?.label, 'kn'),
    navbar_cta_href:         str(navbar.ctaButton?.href),
    navbar_login_label_en:   ml(navbar.loginLabel, 'en'),
    navbar_login_label_hi:   ml(navbar.loginLabel, 'hi'),
    navbar_login_label_kn:   ml(navbar.loginLabel, 'kn'),
    navbar_signup_label_en:  ml(navbar.signupLabel, 'en'),
    navbar_signup_label_hi:  ml(navbar.signupLabel, 'hi'),
    navbar_signup_label_kn:  ml(navbar.signupLabel, 'kn'),
    navbar_signout_label_en: ml(navbar.signoutLabel, 'en'),
    navbar_signout_label_hi: ml(navbar.signoutLabel, 'hi'),
    navbar_signout_label_kn: ml(navbar.signoutLabel, 'kn'),

    footer_brand_name:    str(footer.brandName),
    footer_tagline_en:    ml(footer.tagline, 'en'),
    footer_tagline_hi:    ml(footer.tagline, 'hi'),
    footer_tagline_kn:    ml(footer.tagline, 'kn'),
    footer_copyright_en:  ml(footer.copyright, 'en'),
    footer_copyright_hi:  ml(footer.copyright, 'hi'),
    footer_copyright_kn:  ml(footer.copyright, 'kn'),

    sidebar_brand_name:     str(sidebar.brandName),
    sidebar_brand_subtitle: str(sidebar.brandSubtitle),
    sidebar_status_text:    str(sidebar.statusText),
    sidebar_status_badge:   str(sidebar.statusBadge),
  }

  await api('PATCH', '/items/site_config/site-config', update)
  console.log(`  ✓ site_config populated — ${Object.values(update).filter(v => v !== null).length} fields`)
}

// ── Step 3: hide old JSON fields in Directus UI ───────────────────────────────

async function hideOldFields() {
  console.log('\n📦  Hiding old JSON fields in Directus UI…')

  const toHide: [string, string][] = [
    ['pages_translations', 'sections'],
    ['site_config', 'navbar_config'],
    ['site_config', 'footer_config'],
    ['site_config', 'sidebar_config'],
    ['site_config', 'mobile_nav_config'],
  ]

  for (const [collection, field] of toHide) {
    if (await fieldExists(collection, field)) {
      await api('PATCH', `/fields/${collection}/${field}`, {
        meta: {
          hidden: true,
          note: '[migrated — data now in individual fields above. Do not edit this JSON directly.]',
        },
      })
      console.log(`  ✓ ${collection}.${field} hidden`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  ContentFlow — migrate to field-based content model')
  console.log(`    URL: ${BASE_URL}\n`)

  try {
    await api('GET', '/collections')
    console.log('✓  Directus reachable\n')
  } catch {
    console.error('❌  Cannot reach Directus — check NEXT_PUBLIC_DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN')
    process.exit(1)
  }

  // Step 1 — Add fields
  console.log('📦  Adding fields to pages_translations…')
  await addFieldsToCollection('pages_translations', PAGE_TRANSLATION_FIELDS)

  console.log('\n📦  Adding fields to site_config…')
  await addFieldsToCollection('site_config', SITE_CONFIG_FIELDS)

  // Step 2 — Migrate data
  await migratePageTranslations()
  await migrateSiteConfig()

  // Step 3 — Hide old JSON fields
  await hideOldFields()

  console.log('\n✅  Migration complete!')
  console.log('\n   Next steps:')
  console.log('   1. Run: git pull (get the updated frontend code)')
  console.log('   2. Deploy to Vercel')
  console.log('   3. Test visual editing — every text element now has its own field\n')
}

main().catch(err => {
  console.error('\n❌  Migration failed:', err.message)
  process.exit(1)
})