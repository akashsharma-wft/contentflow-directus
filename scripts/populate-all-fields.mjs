/**
 * scripts/populate-all-fields.mjs
 *
 * Full audit + migration: for every page translation in Directus,
 * reads the sections JSON blob and writes all content into individual
 * translation fields so the visual editor is never empty.
 *
 * Run: node --env-file=.env.local scripts/populate-all-fields.mjs
 */

import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk'

const url   = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://contentflow.directus.app'
const token = process.env.DIRECTUS_ADMIN_TOKEN
if (!token) { console.error('DIRECTUS_ADMIN_TOKEN not set'); process.exit(1) }

const client = createDirectus(url).with(staticToken(token)).with(rest())

// ── section-type → patch builder ──────────────────────────────────────────────

function extractSection(sections, ...types) {
  return sections.find(s => types.includes(s._type) || types.includes(s.sectionType)) ?? null
}

function fromSection(s, key) {
  // handle both top-level and nested { sectionType, [sectionType]: { ... } }
  if (!s) return null
  const nested = s[key] ?? s[s.sectionType] ?? null
  return nested ?? s
}

function str(v) { return (v && typeof v === 'string') ? v : null }
function arr(v) { return (v && Array.isArray(v)) ? v : null }

function buildPatch(sections) {
  const patch = {}
  const set = (k, v) => { if (v !== null && v !== undefined) patch[k] = v }

  // ── Hero ────────────────────────────────────────────────────────────────────
  const hero = extractSection(sections, 'heroSection')
  if (hero) {
    set('hero_heading',           str(hero.heading))
    set('hero_subheading',        str(hero.subheading))
    set('hero_badge',             str(hero.badge))
    set('hero_community_text',    str(hero.communityText))
    set('hero_primary_cta_label', str(hero.primaryCta?.label   ?? hero.primaryCtaLabel))
    set('hero_primary_cta_href',  str(hero.primaryCta?.href    ?? hero.primaryCtaHref))
    set('hero_secondary_cta_label', str(hero.secondaryCta?.label ?? hero.secondaryCtaLabel))
    set('hero_secondary_cta_href',  str(hero.secondaryCta?.href  ?? hero.secondaryCtaHref))
  }

  // ── Featured posts ───────────────────────────────────────────────────────────
  const fp = extractSection(sections, 'featuredPostsSection')
  if (fp) {
    set('featured_posts_heading',      str(fp.heading))
    set('featured_posts_subheading',   str(fp.subheading))
    set('featured_posts_view_all',     str(fp.viewAllLabel))
    set('featured_posts_view_all_href', str(fp.viewAllHref))
  }

  // ── Recent posts ─────────────────────────────────────────────────────────────
  const rp = extractSection(sections, 'recentPostsSection')
  if (rp) {
    set('recent_posts_heading',    str(rp.heading))
    set('recent_posts_subheading', str(rp.subheading))
    set('recent_posts_view_all',   str(rp.viewAllLabel))
    set('recent_posts_view_all_href', str(rp.viewAllHref))
    set('recent_posts_load_more',  str(rp.loadMoreLabel ?? 'Load More Stories'))
  }

  // ── CTA ──────────────────────────────────────────────────────────────────────
  const cta = extractSection(sections, 'ctaSection')
  if (cta) {
    set('cta_heading',       str(cta.heading))
    set('cta_body',          str(cta.body))
    set('cta_primary_label', str(cta.primaryButton?.label ?? cta.primaryCtaLabel ?? cta.primaryLabel))
    set('cta_primary_href',  str(cta.primaryButton?.href  ?? cta.primaryCtaHref  ?? cta.primaryHref))
  }

  // ── Auth hero ─────────────────────────────────────────────────────────────────
  const ah = extractSection(sections, 'authHeroSection')
  if (ah) {
    set('auth_hero_badge',          str(ah.badge))
    set('auth_hero_headline',       str(ah.headline))
    set('auth_hero_footer_note',    str(ah.footerNote))
    const f = ah.features ?? []
    set('auth_hero_feature_1_text', str(f[0]?.text))
    set('auth_hero_feature_2_text', str(f[1]?.text))
    set('auth_hero_feature_3_text', str(f[2]?.text))
  }

  // ── Auth form ─────────────────────────────────────────────────────────────────
  const af = extractSection(sections, 'authSection')
  if (af) {
    set('auth_heading',              str(af.heading))
    set('auth_google_label',         str(af.googleLabel))
    set('auth_divider_label',        str(af.dividerLabel))
    set('auth_name_label',           str(af.nameLabel))
    set('auth_name_placeholder',     str(af.namePlaceholder))
    set('auth_email_label',          str(af.emailLabel))
    set('auth_email_placeholder',    str(af.emailPlaceholder))
    set('auth_password_label',       str(af.passwordLabel))
    set('auth_password_placeholder', str(af.passwordPlaceholder))
    set('auth_submit_label',         str(af.submitLabel))
    set('auth_footer_text',          str(af.footerText))
    set('auth_footer_link_label',    str(af.footerLinkLabel))
    set('auth_footer_link_href',     str(af.footerLinkHref))
  }

  // ── Posts page ────────────────────────────────────────────────────────────────
  const ph = fromSection(extractSection(sections, 'postsHeader'), 'postsHeader')
  if (ph) {
    set('posts_heading',    str(ph.heading))
    set('posts_subheading', str(ph.subheading))
    set('posts_api_badge',  str(ph.apiBadge ?? ph.apiLabel))
  }

  const ps = fromSection(extractSection(sections, 'postsStats'), 'postsStats')
  if (ps) {
    set('posts_my_label',        str(ps.myPostsLabel))
    set('posts_published_label', str(ps.publishedLabel))
    set('posts_drafts_label',    str(ps.draftsLabel))
  }

  const pa = fromSection(extractSection(sections, 'postsActions'), 'postsActions')
  if (pa) {
    set('posts_sync_label', str(pa.syncButtonLabel))
    set('posts_new_label',  str(pa.newPostButtonLabel))
  }

  const psr = fromSection(extractSection(sections, 'postsSearch'), 'postsSearch')
  if (psr) {
    set('posts_search_placeholder', str(psr.searchPlaceholder))
  }

  const pt = fromSection(extractSection(sections, 'postsTable'), 'postsTable')
  if (pt) {
    set('posts_col_title',           str(pt.colTitle))
    set('posts_col_status',          str(pt.colStatus))
    set('posts_col_tags',            str(pt.colTags))
    set('posts_col_modified',        str(pt.colLastModified ?? pt.colModified))
    set('posts_empty_title',         str(pt.emptyTitle))
    set('posts_empty_body',          str(pt.emptyBody))
    set('posts_empty_cta',           str(pt.emptyCtaLabel))
    set('posts_load_more',           str(pt.loadMoreLabel ?? 'Load more'))
    set('posts_view_label',          str(pt.viewLabel))
    set('posts_edit_label',          str(pt.editLabel))
    set('posts_delete_label',        str(pt.deleteLabel))
    set('posts_delete_dialog_title', str(pt.deleteDialogTitle))
    set('posts_delete_dialog_body',  str(pt.deleteDialogBody))
    set('posts_delete_confirm',      str(pt.deleteConfirmLabel ?? pt.deleteConfirm))
    set('posts_delete_cancel',       str(pt.deleteCancelLabel  ?? pt.deleteCancel))
  }

  // ── Billing ────────────────────────────────────────────────────────────────────
  const bh = fromSection(extractSection(sections, 'billingHeader'), 'billingHeader')
  if (bh) {
    set('billing_heading',    str(bh.heading))
    set('billing_subheading', str(bh.subheading))
  }

  const bc = fromSection(extractSection(sections, 'billingCurrentPlan'), 'billingCurrentPlan')
  if (bc) {
    set('billing_current_plan_label', str(bc.currentPlanLabel))
    set('billing_active_badge',       str(bc.activeBadgeLabel))
    set('billing_cancelling_badge',   str(bc.cancellingBadgeLabel))
    set('billing_free_badge',         str(bc.freeTierBadgeLabel))
    set('billing_manage_label',       str(bc.manageLabel))
    set('billing_cancel_label',       str(bc.cancelLabel))
    set('billing_reactivate_label',   str(bc.reactivateLabel))
    set('billing_upgrade_label',      str(bc.upgradeLabel))
    set('billing_cancelling_note',    str(bc.cancellingNote))
  }

  const bu = fromSection(extractSection(sections, 'billingUsage'), 'billingUsage')
  if (bu) {
    set('billing_usage_heading',  str(bu.usageHeading))
    set('billing_posts_label',    str(bu.postsUsageLabel))
    set('billing_api_label',      str(bu.apiUsageLabel))
    set('billing_storage_label',  str(bu.storageUsageLabel))
    set('billing_seats_label',    str(bu.seatsUsageLabel))
  }

  const bg = fromSection(extractSection(sections, 'billingPlansGrid'), 'billingPlansGrid')
  if (bg) {
    set('billing_plans_heading',   str(bg.plansHeading))
    set('billing_free_name',       str(bg.freePlanName))
    set('billing_free_tagline',    str(bg.freePlanTagline))
    set('billing_free_price',      str(bg.freePlanPrice))
    set('billing_free_features',   arr(bg.freePlanFeatures))
    set('billing_pro_name',        str(bg.proPlanName))
    set('billing_pro_tagline',     str(bg.proPlanTagline))
    set('billing_pro_badge',       str(bg.proBadge))
    set('billing_pro_features',    arr(bg.proPlanFeatures))
    set('billing_upgrade_cta',     str(bg.upgradeCtaLabel))
    set('billing_downgrade_cta',   str(bg.downgradeCtaLabel))
    set('billing_current_plan_btn',str(bg.currentPlanButtonLabel))
  }

  const bf = fromSection(extractSection(sections, 'billingFooter'), 'billingFooter')
  if (bf) {
    set('billing_stripe_note',  str(bf.stripeNote))
    set('billing_webhook_note', str(bf.webhookNote))
  }

  // ── Billing success ────────────────────────────────────────────────────────────
  const bsh = fromSection(extractSection(sections, 'billingSuccessHero'), 'billingSuccessHero')
  if (bsh) {
    set('billing_success_heading',    str(bsh.heading))
    set('billing_success_subheading', str(bsh.subheading))
    set('billing_success_body',       str(bsh.body))
  }

  const bsa = fromSection(extractSection(sections, 'billingSuccessActions'), 'billingSuccessActions')
  if (bsa) {
    set('billing_success_primary_label',   str(bsa.primaryLabel))
    set('billing_success_primary_href',    str(bsa.primaryHref))
    set('billing_success_secondary_label', str(bsa.secondaryLabel))
    set('billing_success_secondary_href',  str(bsa.secondaryHref))
  }

  // ── Settings ──────────────────────────────────────────────────────────────────
  const seth = fromSection(extractSection(sections, 'settingsHeader'), 'settingsHeader')
  if (seth) {
    set('settings_heading',    str(seth.heading))
    set('settings_subheading', str(seth.subheading))
  }

  const seti = fromSection(extractSection(sections, 'settingsInfo'), 'settingsInfo')
  if (seti) {
    set('settings_upload_photo_label', str(seti.uploadPhotoLabel))
  }

  const setf = fromSection(extractSection(sections, 'settingsForm'), 'settingsForm')
  if (setf) {
    set('settings_display_name_label',  str(setf.displayNameLabel))
    set('settings_email_label',         str(setf.emailLabel))
    set('settings_email_helper',        str(setf.emailHelperText ?? setf.emailHelper))
    set('settings_bio_label',           str(setf.bioLabel))
    set('settings_bio_placeholder',     str(setf.bioPlaceholder))
    set('settings_website_label',       str(setf.websiteLabel))
    set('settings_website_placeholder', str(setf.websitePlaceholder))
    set('settings_website_error',       str(setf.websiteError))
    set('settings_save_label',          str(setf.saveLabel))
    set('settings_discard_label',       str(setf.discardLabel))
  }

  const setd = fromSection(extractSection(sections, 'settingsDanger'), 'settingsDanger')
  if (setd) {
    set('settings_danger_heading', str(setd.heading))
    set('settings_danger_body',    str(setd.body))
    set('settings_danger_warning', str(setd.warningText ?? setd.warning))
    set('settings_delete_label',   str(setd.deleteLabel))
  }

  // ── Analytics ─────────────────────────────────────────────────────────────────
  const an = fromSection(extractSection(sections, 'analytics'), 'analytics')
  if (an) {
    set('analytics_heading',       str(an.heading))
    set('analytics_subheading',    str(an.subheading))
    set('analytics_events_label',  str(an.eventsLabel))
    set('analytics_users_label',   str(an.usersLabel ?? an.avgSessionLabel))
    set('analytics_empty_title',   str(an.emptyTitle))
    set('analytics_empty_body',    str(an.emptyBody))
    set('analytics_refresh_label', str(an.refreshLabel))
    set('analytics_prev_label',    str(an.prevLabel))
    set('analytics_next_label',    str(an.nextLabel))
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  const adm = fromSection(extractSection(sections, 'admin'), 'admin')
  if (adm) {
    set('admin_heading',                   str(adm.heading))
    set('admin_subheading',                str(adm.subheading))
    set('admin_total_users_label',         str(adm.totalUsersLabel))
    set('admin_pro_label',                 str(adm.proLabel))
    set('admin_free_label',                str(adm.freeLabel))
    set('admin_col_user',                  str(adm.colUser))
    set('admin_col_plan',                  str(adm.colPlan))
    set('admin_col_role',                  str(adm.colRole))
    set('admin_col_joined',                str(adm.colJoined))
    set('admin_empty_label',               str(adm.emptyLabel))
    set('admin_invite_heading',            str(adm.inviteHeading))
    set('admin_invite_form_title',         str(adm.inviteFormTitle))
    set('admin_invite_email_label',        str(adm.inviteEmailLabel))
    set('admin_invite_email_placeholder',  str(adm.inviteEmailPlaceholder))
    set('admin_invite_message_label',      str(adm.inviteMessageLabel))
    set('admin_invite_send_label',         str(adm.inviteSendLabel))
  }

  return patch
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const pages = await client.request(
    readItems('pages', { fields: ['id', 'slug', 'translations.*'], limit: 50 })
  )

  let totalPatched = 0

  for (const page of pages) {
    console.log(`\n📄 ${page.slug}`)
    for (const tr of page.translations ?? []) {
      const sections = tr.sections ?? []
      const patch = buildPatch(sections)

      if (Object.keys(patch).length === 0) {
        console.log(`  [${tr.languages_code}] nothing to patch`)
        continue
      }

      await client.request(updateItem('pages_translations', tr.id, patch))
      totalPatched += Object.keys(patch).length
      console.log(`  [${tr.languages_code}] patched ${Object.keys(patch).length} fields`)
    }
  }

  console.log(`\n✅ Done — ${totalPatched} total fields updated`)
}

run().catch(e => { console.error(e); process.exit(1) })
