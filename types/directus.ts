/**
 * types/directus.ts
 *
 * Updated after field-based migration.
 * pages_translations and site_config now have individual string fields
 * instead of JSON blobs. mergePage() / toSiteConfig() read the new fields
 * with fallback to the old sections/config JSON for backward compat.
 */

export type {
  PortableTextBlock,
  CtaButton,
  HeroSection,
  FeaturesFeature,
  FeaturesSection,
  PostsSection,
  AuthSection,
  AnalyticsSection,
  NavbarSection,
  FooterSection,
  CtaSection,
  FeaturedPostsSection,
  RecentPostsSection,
  RichTextSection,
  StatsSection,
  FormSection,
  HeadingSection,
  FeatureListSection,
  TestimonialsSection,
  FaqSection,
  PricingSection,
  TeamSection,
  LogoBarSection,
  CarouselSection,
  TableSection,
  TimelineSection,
  BannerSection,
  TabsSection,
  ImageSection,
  GallerySection,
  VideoSection,
  NewsletterSection,
  ContactSection,
  AuthHeroSection,
  AuthHeroFeature,
  LoginSection,
  SignupSection,
  NotFoundSection,
  GridSection,
  ColumnsSection,
  SpacerSection,
  DividerSection,
  PostsPageSection,
  AnalyticsPageSection,
  SettingsPageSection,
  BillingPageSection,
  AdminPageSection,
  LoginPageSection,
  SignupPageSection,
  PostDetailPageSection,
  PageSection,
  ComponentDoc,
  CmsSection,
  SectionHeroContent,
  SectionFeaturedPostsContent,
  SectionRecentPostsContent,
  SectionCtaContent,
  SectionAuthHeroContent,
  SectionAuthFormContent,
  SectionFeaturesContent,
  SectionMarker,
  SectionPostDetailContent,
  SectionPostDetailHeaderContent,
  SectionPostDetailMetaContent,
  SectionPostDetailBodyContent,
  SectionPostDetailTagsContent,
  SectionPostDetailBackLinkContent,
  SectionPostsHeaderContent,
  SectionPostsStatsContent,
  SectionPostsActionsContent,
  SectionPostsSearchContent,
  SectionPostsTableContent,
  SectionAnalyticsContent,
  SectionBillingHeaderContent,
  SectionBillingCurrentPlanContent,
  SectionBillingUsageContent,
  SectionBillingPlansGridContent,
  SectionBillingFooterContent,
  SectionBillingSuccessHeroContent,
  SectionBillingSuccessActionsContent,
  SectionSettingsHeaderContent,
  SectionSettingsInfoContent,
  SectionSettingsFormContent,
  SectionSettingsDangerContent,
  SectionAdminContent,
  SiteNavItem,
  SiteNavItemLabel,
  NavRole,
  SiteCtaButton,
  SiteLink,
  SiteFooterColumn,
  SiteSocialLink,
  SiteSidebarFooterLink,
  SiteNavbarConfig,
  SiteFooterConfig,
  SiteSidebarConfig,
  SiteMobileNavConfig,
  NavLink,
  SidebarNavLink,
} from '@/types/cms'

import type {
  CmsSection,
  SiteNavbarConfig,
  SiteFooterConfig,
  SiteSidebarConfig,
  SiteMobileNavConfig,
} from '@/types/cms'
import { resolveTranslation } from '@/lib/directus/translations'

// ─── Languages ────────────────────────────────────────────────────────────────

export type DirectusLanguageRow = {
  code:      string
  name:      string
  direction: 'ltr' | 'rtl'
}

// ─── Posts translations ───────────────────────────────────────────────────────

export type DirectusPostTranslationRow = {
  id:              number
  posts_id:        string
  languages_code:  string
  title:           string
  excerpt:         string | null
  body:            string | null
  seo_title:       string | null
  seo_description: string | null
}

export type DirectusPostRow = {
  id:           string
  slug:         string
  cover_image:  string | null
  published_at: string | null
  featured:     boolean
  tags:         string[] | null
  author_id:    string | null
  author_name:  string | null
  author_email: string | null
  author_avatar:string | null
  date_created: string
  date_updated: string
  translations?: DirectusPostTranslationRow[]
  // Legacy
  title?:    string
  language?: string
  excerpt?:  string | null
  body?:     string | unknown[] | null
}

export type DirectusPost = {
  _id:                   string
  _type:                 'post'
  _createdAt:            string
  _updatedAt:            string
  title:                 string
  slug:                  string
  language?:             string
  excerpt?:              string
  body?:                 string | unknown[]
  coverImage?:           string
  publishedAt?:          string
  featured?:             boolean
  tags?:                 string[]
  authorId?:             string
  authorName?:           string
  authorEmail?:          string
  authorAvatar?:         string
  resolvedTranslationId?: number
}

export function mergePost(row: DirectusPostRow, preferLang = 'en'): DirectusPost {
  const tr = resolveTranslation(row.translations ?? [], preferLang)
  return {
    _id:                   row.id,
    _type:                 'post',
    _createdAt:            row.date_created,
    _updatedAt:            row.date_updated,
    title:                 tr?.title        ?? row.title    ?? '',
    slug:                  row.slug,
    language:              tr?.languages_code ?? row.language ?? 'en',
    excerpt:               tr?.excerpt     ?? row.excerpt  ?? undefined,
    body:                  tr?.body        ?? row.body     ?? undefined,
    coverImage:            row.cover_image  ?? undefined,
    publishedAt:           row.published_at ?? undefined,
    featured:              row.featured,
    tags:                  row.tags         ?? undefined,
    authorId:              row.author_id    ?? undefined,
    authorName:            row.author_name  ?? undefined,
    authorEmail:           row.author_email ?? undefined,
    authorAvatar:          row.author_avatar ?? undefined,
    resolvedTranslationId: tr?.id,
  }
}

export function toPost(row: DirectusPostRow): DirectusPost {
  return mergePost(row, 'en')
}

// ─── Pages translations ───────────────────────────────────────────────────────

/** Full field-based translation row — all content fields are now individual strings. */
export type DirectusPageTranslationRow = {
  id:              number
  pages_id:        string
  languages_code:  string
  title:           string
  // Legacy JSON fallback (hidden in UI, kept for backward compat)
  sections:        CmsSection[] | null
  seo_title:       string | null
  seo_description: string | null

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero_heading?:             string | null
  hero_subheading?:          string | null
  hero_badge?:               string | null
  hero_community_text?:      string | null
  hero_primary_cta_label?:   string | null
  hero_primary_cta_href?:    string | null
  hero_secondary_cta_label?: string | null
  hero_secondary_cta_href?:  string | null

  // ── Featured posts ────────────────────────────────────────────────────────
  featured_posts_heading?:      string | null
  featured_posts_subheading?:   string | null
  featured_posts_view_all?:     string | null
  featured_posts_view_all_href?: string | null

  // ── Recent posts ──────────────────────────────────────────────────────────
  recent_posts_heading?:      string | null
  recent_posts_subheading?:   string | null
  recent_posts_view_all?:     string | null
  recent_posts_view_all_href?: string | null

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta_heading?:       string | null
  cta_body?:          string | null
  cta_primary_label?: string | null
  cta_primary_href?:  string | null

  // ── Auth hero ─────────────────────────────────────────────────────────────
  auth_hero_badge?:       string | null
  auth_hero_headline?:    string | null
  auth_hero_footer_note?: string | null

  // ── Auth form ─────────────────────────────────────────────────────────────
  auth_heading?:              string | null
  auth_google_label?:         string | null
  auth_divider_label?:        string | null
  auth_name_label?:           string | null
  auth_name_placeholder?:     string | null
  auth_email_label?:          string | null
  auth_email_placeholder?:    string | null
  auth_password_label?:       string | null
  auth_password_placeholder?: string | null
  auth_submit_label?:         string | null
  auth_footer_text?:          string | null
  auth_footer_link_label?:    string | null
  auth_footer_link_href?:     string | null

  // ── Posts page ────────────────────────────────────────────────────────────
  posts_heading?:             string | null
  posts_subheading?:          string | null
  posts_api_badge?:           string | null
  posts_my_label?:            string | null
  posts_published_label?:     string | null
  posts_drafts_label?:        string | null
  posts_sync_label?:          string | null
  posts_new_label?:           string | null
  posts_search_placeholder?:  string | null
  posts_col_title?:           string | null
  posts_col_status?:          string | null
  posts_col_tags?:            string | null
  posts_col_modified?:        string | null
  posts_empty_title?:         string | null
  posts_empty_body?:          string | null
  posts_empty_cta?:           string | null
  posts_load_more?:           string | null
  posts_view_label?:          string | null
  posts_edit_label?:          string | null
  posts_delete_label?:        string | null
  posts_delete_dialog_title?: string | null
  posts_delete_dialog_body?:  string | null
  posts_delete_confirm?:      string | null
  posts_delete_cancel?:       string | null

  // ── Billing ───────────────────────────────────────────────────────────────
  billing_heading?:            string | null
  billing_subheading?:         string | null
  billing_current_plan_label?: string | null
  billing_active_badge?:       string | null
  billing_cancelling_badge?:   string | null
  billing_free_badge?:         string | null
  billing_manage_label?:       string | null
  billing_cancel_label?:       string | null
  billing_reactivate_label?:   string | null
  billing_upgrade_label?:      string | null
  billing_cancelling_note?:    string | null
  billing_usage_heading?:      string | null
  billing_posts_label?:        string | null
  billing_api_label?:          string | null
  billing_storage_label?:      string | null
  billing_seats_label?:        string | null
  billing_plans_heading?:      string | null
  billing_free_name?:          string | null
  billing_free_tagline?:       string | null
  billing_free_price?:         string | null
  billing_free_features?:      string[] | null
  billing_pro_name?:           string | null
  billing_pro_tagline?:        string | null
  billing_pro_badge?:          string | null
  billing_pro_features?:       string[] | null
  billing_upgrade_cta?:        string | null
  billing_downgrade_cta?:      string | null
  billing_current_plan_btn?:   string | null
  billing_stripe_note?:        string | null
  billing_webhook_note?:       string | null

  // ── Billing success ───────────────────────────────────────────────────────
  billing_success_heading?:         string | null
  billing_success_subheading?:      string | null
  billing_success_body?:            string | null
  billing_success_primary_label?:   string | null
  billing_success_primary_href?:    string | null
  billing_success_secondary_label?: string | null
  billing_success_secondary_href?:  string | null

  // ── Settings ──────────────────────────────────────────────────────────────
  settings_heading?:              string | null
  settings_subheading?:           string | null
  settings_upload_photo_label?:   string | null
  settings_display_name_label?:   string | null
  settings_email_label?:          string | null
  settings_email_helper?:         string | null
  settings_bio_label?:            string | null
  settings_bio_placeholder?:      string | null
  settings_website_label?:        string | null
  settings_website_placeholder?:  string | null
  settings_website_error?:        string | null
  settings_save_label?:           string | null
  settings_discard_label?:        string | null
  settings_danger_heading?:       string | null
  settings_danger_body?:          string | null
  settings_danger_warning?:       string | null
  settings_delete_label?:         string | null

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin_heading?:                   string | null
  admin_subheading?:                string | null
  admin_total_users_label?:         string | null
  admin_pro_label?:                 string | null
  admin_free_label?:                string | null
  admin_col_user?:                  string | null
  admin_col_plan?:                  string | null
  admin_col_role?:                  string | null
  admin_col_joined?:                string | null
  admin_empty_label?:               string | null
  admin_invite_heading?:            string | null
  admin_invite_form_title?:         string | null
  admin_invite_email_label?:        string | null
  admin_invite_email_placeholder?:  string | null
  admin_invite_message_label?:      string | null
  admin_invite_send_label?:         string | null

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics_heading?:        string | null
  analytics_subheading?:     string | null
  analytics_events_label?:   string | null
  analytics_users_label?:    string | null
  analytics_empty_title?:    string | null
  analytics_empty_body?:     string | null
  analytics_refresh_label?:  string | null
  analytics_prev_label?:     string | null
  analytics_next_label?:     string | null
}

// ─── DirectusPage ─────────────────────────────────────────────────────────────

export type DirectusPageRow = {
  id:       string
  slug:     string
  status:   'published' | 'draft'
  access:   'guest' | 'user' | 'admin'
  layout:   'home' | 'dashboard' | 'auth'
  og_image: string | null
  translations?: DirectusPageTranslationRow[]
  // Legacy
  title?:           string
  language?:        string
  sections?:        CmsSection[] | null
  seo_title?:       string | null
  seo_description?: string | null
}

/**
 * Normalised page shape — now carries the full translation row alongside
 * the merged sections, so section components can read individual fields
 * directly and add granular data-directus bindings.
 */
export type DirectusPage = {
  _id:                   string
  _type:                 'page'
  title:                 string
  slug:                  { current: string }
  language?:             string
  access?:               'guest' | 'user' | 'admin'
  layout?:               'home' | 'dashboard' | 'auth'
  sections?:             CmsSection[]
  seoTitle?:             string
  seoDescription?:       string
  ogImage?:              string
  resolvedTranslationId?: number
  /** Full translation row — available to section components for field-level visual editing bindings */
  translationRow?:        DirectusPageTranslationRow
}

export function mergePage(row: DirectusPageRow, preferLang = 'en'): DirectusPage {
  const tr = resolveTranslation(row.translations ?? [], preferLang)

  return {
    _id:                   row.id,
    _type:                 'page',
    title:                 tr?.title           ?? row.title   ?? '',
    slug:                  { current: row.slug },
    language:              tr?.languages_code  ?? row.language ?? 'en',
    access:                row.access,
    layout:                row.layout,
    sections:              (tr?.sections ?? row.sections ?? undefined) as CmsSection[] | undefined,
    seoTitle:              tr?.seo_title       ?? row.seo_title        ?? undefined,
    seoDescription:        tr?.seo_description ?? row.seo_description  ?? undefined,
    ogImage:               row.og_image        ?? undefined,
    resolvedTranslationId: tr?.id,
    translationRow:        tr ?? undefined,
  }
}

export function toPage(row: DirectusPageRow): DirectusPage {
  return mergePage(row, 'en')
}

export type DirectusNavPage = {
  _id:    string
  title:  string
  slug:   string
  access: 'guest' | 'user' | 'admin'
  layout: 'home' | 'auth' | 'dashboard'
}

// ─── Site config translations ─────────────────────────────────────────────────

export type DirectusSiteConfigTranslationRow = {
  id:              number
  site_config_id:  string
  languages_code:  string
  // Navbar
  navbar_cta_label?:     string | null
  navbar_login_label?:   string | null
  navbar_signup_label?:  string | null
  navbar_signout_label?: string | null
  navbar_item_1_label?:  string | null
  navbar_item_2_label?:  string | null
  navbar_item_3_label?:  string | null
  navbar_item_4_label?:  string | null
  navbar_item_5_label?:  string | null
  // Footer
  footer_tagline?:            string | null
  footer_copyright?:          string | null
  footer_col_1_heading?:      string | null
  footer_col_1_link_1_label?: string | null
  footer_col_1_link_2_label?: string | null
  footer_col_2_heading?:      string | null
  footer_col_2_link_1_label?: string | null
  footer_col_2_link_2_label?: string | null
  // Sidebar
  sidebar_brand_name?:  string | null
  sidebar_status_text?: string | null
  sidebar_nav_1_label?: string | null
  sidebar_nav_2_label?: string | null
  sidebar_nav_3_label?: string | null
  sidebar_nav_4_label?: string | null
  sidebar_nav_5_label?: string | null
}

// ─── Site config ──────────────────────────────────────────────────────────────

/** Full field-based site_config row. */
export type DirectusSiteConfigRow = {
  id:                string
  site_name:         string
  // Legacy JSON fields (hidden in UI, kept for backward compat)
  navbar_config?:     SiteNavbarConfig | null
  footer_config?:     SiteFooterConfig | null
  sidebar_config?:    SiteSidebarConfig | null
  mobile_nav_config?: SiteMobileNavConfig | null

  // ── Navbar flat fields ────────────────────────────────────────────────────
  navbar_brand_name?:       string | null
  navbar_cta_label_en?:     string | null
  navbar_cta_label_hi?:     string | null
  navbar_cta_label_kn?:     string | null
  navbar_cta_href?:         string | null
  navbar_login_label_en?:   string | null
  navbar_login_label_hi?:   string | null
  navbar_login_label_kn?:   string | null
  navbar_signup_label_en?:  string | null
  navbar_signup_label_hi?:  string | null
  navbar_signup_label_kn?:  string | null
  navbar_signout_label_en?: string | null
  navbar_signout_label_hi?: string | null
  navbar_signout_label_kn?: string | null

  // ── Footer flat fields ────────────────────────────────────────────────────
  footer_brand_name?:    string | null
  footer_tagline_en?:    string | null
  footer_tagline_hi?:    string | null
  footer_tagline_kn?:    string | null
  footer_copyright_en?:  string | null
  footer_copyright_hi?:  string | null
  footer_copyright_kn?:  string | null

  // ── Sidebar flat fields ───────────────────────────────────────────────────
  sidebar_brand_name?:     string | null
  sidebar_brand_subtitle?: string | null
  sidebar_status_text?:    string | null
  sidebar_status_badge?:   string | null

  // ── Navbar nav items (up to 5) ────────────────────────────────────────────
  navbar_item_1_label_en?: string | null; navbar_item_1_label_hi?: string | null; navbar_item_1_label_kn?: string | null; navbar_item_1_href?: string | null
  navbar_item_2_label_en?: string | null; navbar_item_2_label_hi?: string | null; navbar_item_2_label_kn?: string | null; navbar_item_2_href?: string | null
  navbar_item_3_label_en?: string | null; navbar_item_3_label_hi?: string | null; navbar_item_3_label_kn?: string | null; navbar_item_3_href?: string | null
  navbar_item_4_label_en?: string | null; navbar_item_4_label_hi?: string | null; navbar_item_4_label_kn?: string | null; navbar_item_4_href?: string | null
  navbar_item_5_label_en?: string | null; navbar_item_5_label_hi?: string | null; navbar_item_5_label_kn?: string | null; navbar_item_5_href?: string | null

  // ── Sidebar nav items (up to 5) ───────────────────────────────────────────
  sidebar_nav_1_label_en?: string | null; sidebar_nav_1_label_hi?: string | null; sidebar_nav_1_label_kn?: string | null; sidebar_nav_1_href?: string | null
  sidebar_nav_2_label_en?: string | null; sidebar_nav_2_label_hi?: string | null; sidebar_nav_2_label_kn?: string | null; sidebar_nav_2_href?: string | null
  sidebar_nav_3_label_en?: string | null; sidebar_nav_3_label_hi?: string | null; sidebar_nav_3_label_kn?: string | null; sidebar_nav_3_href?: string | null
  sidebar_nav_4_label_en?: string | null; sidebar_nav_4_label_hi?: string | null; sidebar_nav_4_label_kn?: string | null; sidebar_nav_4_href?: string | null
  sidebar_nav_5_label_en?: string | null; sidebar_nav_5_label_hi?: string | null; sidebar_nav_5_label_kn?: string | null; sidebar_nav_5_href?: string | null

  // ── Footer columns (2 columns × 2 links) ─────────────────────────────────
  footer_col_1_heading_en?: string | null; footer_col_1_heading_hi?: string | null; footer_col_1_heading_kn?: string | null
  footer_col_1_link_1_label_en?: string | null; footer_col_1_link_1_label_hi?: string | null; footer_col_1_link_1_label_kn?: string | null; footer_col_1_link_1_href?: string | null
  footer_col_1_link_2_label_en?: string | null; footer_col_1_link_2_label_hi?: string | null; footer_col_1_link_2_label_kn?: string | null; footer_col_1_link_2_href?: string | null
  footer_col_2_heading_en?: string | null; footer_col_2_heading_hi?: string | null; footer_col_2_heading_kn?: string | null
  footer_col_2_link_1_label_en?: string | null; footer_col_2_link_1_label_hi?: string | null; footer_col_2_link_1_label_kn?: string | null; footer_col_2_link_1_href?: string | null
  footer_col_2_link_2_label_en?: string | null; footer_col_2_link_2_label_hi?: string | null; footer_col_2_link_2_label_kn?: string | null; footer_col_2_link_2_href?: string | null
  // Translations
  translations?: DirectusSiteConfigTranslationRow[]
}

export type DirectusSiteConfig = {
  _id:              string
  _type:            'siteConfig'
  title:            string
  siteName:         string
  navbarConfig?:    SiteNavbarConfig
  footerConfig?:    SiteFooterConfig
  sidebarConfig?:   SiteSidebarConfig
  mobileNavConfig?: SiteMobileNavConfig
  // Flat fields for visual editing bindings
  navbarBrandName?:      string
  navbarCtaLabelEn?:     string
  navbarCtaLabelHi?:     string
  navbarCtaLabelKn?:     string
  navbarCtaHref?:        string
  navbarLoginLabelEn?:   string
  navbarLoginLabelHi?:   string
  navbarLoginLabelKn?:   string
  navbarSignupLabelEn?:  string
  navbarSignupLabelHi?:  string
  navbarSignupLabelKn?:  string
  navbarSignoutLabelEn?: string
  navbarSignoutLabelHi?: string
  navbarSignoutLabelKn?: string
  footerBrandName?:      string
  footerTaglineEn?:      string
  footerTaglineHi?:      string
  footerTaglineKn?:      string
  footerCopyrightEn?:    string
  footerCopyrightHi?:    string
  footerCopyrightKn?:    string
  sidebarBrandName?:     string
  sidebarBrandSubtitle?: string
  sidebarStatusText?:    string
  sidebarStatusBadge?:   string
  // Nav item flat fields (for visual editing bindings in components)
  navbarItems?: Array<{ labelEn: string; labelHi?: string; labelKn?: string; href: string }>
  sidebarNavItems?: Array<{ labelEn: string; labelHi?: string; labelKn?: string; href: string }>
  footerColumns?: Array<{
    headingEn: string; headingHi?: string; headingKn?: string
    links: Array<{ labelEn: string; labelHi?: string; labelKn?: string; href: string }>
  }>
  siteConfigTranslationId?: number
}

export function toSiteConfig(row: DirectusSiteConfigRow, lang = 'en'): DirectusSiteConfig {
  // Resolve translation row for this language
  const tr = resolveTranslation(row.translations ?? [], lang) as DirectusSiteConfigTranslationRow | null | undefined

  // Cast row to a loose dict for dynamic field access (translations field is excluded by using unknown first)
  const r = row as unknown as Record<string, string | null | undefined>

  // Build nav items from flat fields (up to 5 each), preferring translation labels
  function buildNavItemsWithTranslation(prefix: string) {
    const items = []
    for (let n = 1; n <= 5; n++) {
      const labelEn = (tr as Record<string,string|null|undefined> | null | undefined)?.[`${prefix.replace('navbar_item', 'navbar_item_').replace('sidebar_nav_', 'sidebar_nav_')}${n}_label`]
        ?? r[`${prefix}_${n}_label_en`]
      const href    = r[`${prefix}_${n}_href`]
      if (!labelEn && !href) continue
      items.push({
        _key: `${prefix}_${n}`,
        label: {
          en: labelEn ?? '',
          hi: r[`${prefix}_${n}_label_hi`] ?? undefined,
          kn: r[`${prefix}_${n}_label_kn`] ?? undefined,
        },
        href: href ?? '',
      })
    }
    return items
  }

  // Build nav items from flat fields (up to 5 each)
  function buildNavItems(prefix: string) {
    const items = []
    for (let n = 1; n <= 5; n++) {
      const labelEn = r[`${prefix}_${n}_label_en`]
      const href    = r[`${prefix}_${n}_href`]
      if (!labelEn && !href) continue
      items.push({
        _key: `${prefix}_${n}`,
        label: {
          en: labelEn ?? '',
          hi: r[`${prefix}_${n}_label_hi`] ?? undefined,
          kn: r[`${prefix}_${n}_label_kn`] ?? undefined,
        },
        href: href ?? '',
      })
    }
    return items
  }

  const flatNavItems     = buildNavItems('navbar_item')
  const flatSidebarItems = buildNavItems('sidebar_nav')

  // Build footer columns from flat fields
  function buildFooterColumns() {
    const cols = []
    for (let c = 1; c <= 2; c++) {
      const headingEn = r[`footer_col_${c}_heading_en`]
      if (!headingEn) continue
      const links = []
      for (let l = 1; l <= 2; l++) {
        const llEn = r[`footer_col_${c}_link_${l}_label_en`]
        const lh   = r[`footer_col_${c}_link_${l}_href`]
        if (!llEn && !lh) continue
        links.push({
          _key: `footer_col_${c}_link_${l}`,
          label: llEn ?? '',
          href:  lh   ?? '#',
        })
      }
      cols.push({
        _key: `footer_col_${c}`,
        heading: headingEn ?? '',
        links,
      })
    }
    return cols
  }

  const flatFooterColumns = buildFooterColumns()

  // Build navbarConfig — prefer translation fields, then flat fields, fall back to legacy JSON
  const legacyNavbar = row.navbar_config ?? undefined
  const navbarConfig: SiteNavbarConfig = {
    ...legacyNavbar,
    brandName: row.navbar_brand_name ?? legacyNavbar?.brandName,
    items: flatNavItems.length > 0 ? flatNavItems : legacyNavbar?.items,
    ctaButton: {
      label: {
        en: tr?.navbar_cta_label ?? row.navbar_cta_label_en ?? (typeof legacyNavbar?.ctaButton?.label === 'object' ? (legacyNavbar.ctaButton.label as Record<string,string>).en : legacyNavbar?.ctaButton?.label as string) ?? 'Get Started',
        hi: row.navbar_cta_label_hi ?? (typeof legacyNavbar?.ctaButton?.label === 'object' ? (legacyNavbar.ctaButton.label as Record<string,string>).hi : undefined) ?? undefined,
        kn: row.navbar_cta_label_kn ?? (typeof legacyNavbar?.ctaButton?.label === 'object' ? (legacyNavbar.ctaButton.label as Record<string,string>).kn : undefined) ?? undefined,
      },
      href: row.navbar_cta_href ?? legacyNavbar?.ctaButton?.href,
    },
    loginLabel:   { en: tr?.navbar_login_label   ?? row.navbar_login_label_en   ?? 'Login',    hi: row.navbar_login_label_hi   ?? undefined, kn: row.navbar_login_label_kn   ?? undefined },
    signupLabel:  { en: tr?.navbar_signup_label  ?? row.navbar_signup_label_en  ?? 'Sign up',  hi: row.navbar_signup_label_hi  ?? undefined, kn: row.navbar_signup_label_kn  ?? undefined },
    signoutLabel: { en: tr?.navbar_signout_label ?? row.navbar_signout_label_en ?? 'Sign out', hi: row.navbar_signout_label_hi ?? undefined, kn: row.navbar_signout_label_kn ?? undefined },
  }

  const legacyFooter = row.footer_config ?? undefined
  const footerConfig: SiteFooterConfig = {
    ...legacyFooter,
    brandName: row.footer_brand_name ?? legacyFooter?.brandName,
    columns:   flatFooterColumns.length > 0 ? flatFooterColumns : legacyFooter?.columns,
    tagline: {
      en: tr?.footer_tagline ?? row.footer_tagline_en ?? (typeof legacyFooter?.tagline === 'string' ? legacyFooter.tagline : (legacyFooter?.tagline as Record<string,string>)?.en) ?? '',
      hi: row.footer_tagline_hi ?? (typeof legacyFooter?.tagline === 'object' ? (legacyFooter.tagline as Record<string,string>)?.hi : undefined) ?? undefined,
      kn: row.footer_tagline_kn ?? (typeof legacyFooter?.tagline === 'object' ? (legacyFooter.tagline as Record<string,string>)?.kn : undefined) ?? undefined,
    },
    copyright: {
      en: tr?.footer_copyright ?? row.footer_copyright_en ?? (typeof legacyFooter?.copyright === 'string' ? legacyFooter.copyright : (legacyFooter?.copyright as Record<string,string>)?.en) ?? '',
      hi: row.footer_copyright_hi ?? (typeof legacyFooter?.copyright === 'object' ? (legacyFooter.copyright as Record<string,string>)?.hi : undefined) ?? undefined,
      kn: row.footer_copyright_kn ?? (typeof legacyFooter?.copyright === 'object' ? (legacyFooter.copyright as Record<string,string>)?.kn : undefined) ?? undefined,
    },
  }

  const legacySidebar = row.sidebar_config ?? undefined
  const sidebarConfig: SiteSidebarConfig = {
    ...legacySidebar,
    brandName:     row.sidebar_brand_name     ?? legacySidebar?.brandName,
    brandSubtitle: row.sidebar_brand_subtitle ?? legacySidebar?.brandSubtitle,
    navItems:      flatSidebarItems.length > 0 ? flatSidebarItems : legacySidebar?.navItems,
    statusText:    row.sidebar_status_text    ?? legacySidebar?.statusText,
    statusBadge:   row.sidebar_status_badge   ?? legacySidebar?.statusBadge,
  }

  // Flat nav/sidebar/footer items for position-based visual editing bindings
  const navbarItems = [1,2,3,4,5].map(n => ({
    labelEn: r[`navbar_item_${n}_label_en`] ?? '',
    labelHi: r[`navbar_item_${n}_label_hi`] ?? undefined,
    labelKn: r[`navbar_item_${n}_label_kn`] ?? undefined,
    href:    r[`navbar_item_${n}_href`]     ?? '',
  }))
  const sidebarNavItems = [1,2,3,4,5].map(n => ({
    labelEn: r[`sidebar_nav_${n}_label_en`] ?? '',
    labelHi: r[`sidebar_nav_${n}_label_hi`] ?? undefined,
    labelKn: r[`sidebar_nav_${n}_label_kn`] ?? undefined,
    href:    r[`sidebar_nav_${n}_href`]     ?? '',
  }))
  const footerColumns = [1,2].map(c => ({
    headingEn: r[`footer_col_${c}_heading_en`] ?? '',
    headingHi: r[`footer_col_${c}_heading_hi`] ?? undefined,
    headingKn: r[`footer_col_${c}_heading_kn`] ?? undefined,
    links: [1,2].map(l => ({
      labelEn: r[`footer_col_${c}_link_${l}_label_en`] ?? '',
      labelHi: r[`footer_col_${c}_link_${l}_label_hi`] ?? undefined,
      labelKn: r[`footer_col_${c}_link_${l}_label_kn`] ?? undefined,
      href:    r[`footer_col_${c}_link_${l}_href`]     ?? '',
    })),
  }))

  return {
    _id:             row.id,
    _type:           'siteConfig',
    title:           row.site_name,
    siteName:        row.site_name,
    navbarConfig,
    footerConfig,
    sidebarConfig,
    mobileNavConfig: row.mobile_nav_config ?? undefined,
    // Flat fields passed through for visual editing bindings in components
    navbarBrandName:      row.navbar_brand_name      ?? undefined,
    navbarCtaLabelEn:     row.navbar_cta_label_en    ?? undefined,
    navbarCtaLabelHi:     row.navbar_cta_label_hi    ?? undefined,
    navbarCtaLabelKn:     row.navbar_cta_label_kn    ?? undefined,
    navbarCtaHref:        row.navbar_cta_href         ?? undefined,
    navbarLoginLabelEn:   row.navbar_login_label_en   ?? undefined,
    navbarLoginLabelHi:   row.navbar_login_label_hi   ?? undefined,
    navbarLoginLabelKn:   row.navbar_login_label_kn   ?? undefined,
    navbarSignupLabelEn:  row.navbar_signup_label_en  ?? undefined,
    navbarSignupLabelHi:  row.navbar_signup_label_hi  ?? undefined,
    navbarSignupLabelKn:  row.navbar_signup_label_kn  ?? undefined,
    navbarSignoutLabelEn: row.navbar_signout_label_en ?? undefined,
    navbarSignoutLabelHi: row.navbar_signout_label_hi ?? undefined,
    navbarSignoutLabelKn: row.navbar_signout_label_kn ?? undefined,
    footerBrandName:      row.footer_brand_name       ?? undefined,
    footerTaglineEn:      row.footer_tagline_en        ?? undefined,
    footerTaglineHi:      row.footer_tagline_hi        ?? undefined,
    footerTaglineKn:      row.footer_tagline_kn        ?? undefined,
    footerCopyrightEn:    row.footer_copyright_en      ?? undefined,
    footerCopyrightHi:    row.footer_copyright_hi      ?? undefined,
    footerCopyrightKn:    row.footer_copyright_kn      ?? undefined,
    sidebarBrandName:     row.sidebar_brand_name        ?? undefined,
    sidebarBrandSubtitle: row.sidebar_brand_subtitle    ?? undefined,
    sidebarStatusText:    row.sidebar_status_text        ?? undefined,
    sidebarStatusBadge:   row.sidebar_status_badge       ?? undefined,
    navbarItems,
    sidebarNavItems,
    footerColumns,
    siteConfigTranslationId: tr?.id,
  }
}

export type DirectusSchema = {
  posts:                        DirectusPostRow[]
  posts_translations:           DirectusPostTranslationRow[]
  pages:                        DirectusPageRow[]
  pages_translations:           DirectusPageTranslationRow[]
  languages:                    DirectusLanguageRow[]
  site_config:                  DirectusSiteConfigRow[]
  site_config_translations:     DirectusSiteConfigTranslationRow[]
}