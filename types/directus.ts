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
  NavRole,
  SiteNavItem,
  SiteFooterColumn,
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
  body:            string | null      // legacy json column — hidden in editor
  body_html:       string | null      // new text column — HTML rich text editor
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
    body:                  tr?.body_html   ?? tr?.body     ?? row.body ?? undefined,
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
  recent_posts_load_more?:     string | null

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta_heading?:       string | null
  cta_body?:          string | null
  cta_primary_label?: string | null
  cta_primary_href?:  string | null

  // ── Auth hero ─────────────────────────────────────────────────────────────
  auth_hero_badge?:            string | null
  auth_hero_headline?:         string | null
  auth_hero_footer_note?:      string | null
  auth_hero_feature_1_text?:   string | null
  auth_hero_feature_2_text?:   string | null
  auth_hero_feature_3_text?:   string | null

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
  posts_featured_label?:      string | null
  posts_featured_of_label?:   string | null
  posts_featured_read_label?: string | null

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

// Per-language nav item shape — single label (already in this language)
export type TranslationNavItemJSON = {
  label:  string
  href:   string
  icon?:  string
  access: 'guest' | 'user' | 'admin'
}

export type TranslationFooterLinkJSON = {
  label: string
  href:  string
}

export type TranslationFooterColumnJSON = {
  heading: string
  links:   TranslationFooterLinkJSON[]
}

// Nav items and footer columns live here (per language).
// Labels, CTA text, brand names are also per-language strings.
export type DirectusSiteConfigTranslationRow = {
  id:              number
  site_config_id:  string
  languages_code:  string
  // Nav items — per-language lists managed in the Translations form
  navbar_items?:      TranslationNavItemJSON[]      | null
  sidebar_items?:     TranslationNavItemJSON[]      | null
  mobile_nav_items?:  TranslationNavItemJSON[]      | null
  footer_columns?:    TranslationFooterColumnJSON[] | null
}

// ─── Site config ──────────────────────────────────────────────────────────────

export type DirectusSiteConfigRow = {
  id:         string
  site_name:  string

  // Global (non-translated) branding / CTA hrefs
  navbar_brand_name?:      string | null
  navbar_cta_href?:        string | null
  footer_brand_name?:      string | null
  sidebar_brand_name?:     string | null
  sidebar_brand_subtitle?: string | null
  sidebar_status_badge?:   string | null

  // Translations relation (includes per-language nav items)
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
  siteConfigTranslationId?: number
}

function accessToVisibleFor(access?: string): NavRole[] {
  if (access === 'admin') return ['admin']
  if (access === 'guest') return ['guest']
  return ['user']
}

function parseTrNavItems(json: TranslationNavItemJSON[] | null | undefined): SiteNavItem[] {
  if (!Array.isArray(json)) return []
  return json.map((item, i) => ({
    _key:       `nav_${i}`,
    label:      { en: item.label },
    href:       item.href,
    icon:       item.icon,
    visibleFor: accessToVisibleFor(item.access),
  }))
}

function parseTrFooterColumns(json: TranslationFooterColumnJSON[] | null | undefined): SiteFooterColumn[] {
  if (!Array.isArray(json)) return []
  return json.map((col, ci) => ({
    _key:    `col_${ci}`,
    heading: { en: col.heading },
    links:   (col.links ?? []).map((l, li) => ({
      _key:  `col_${ci}_link_${li}`,
      label: { en: l.label },
      href:  l.href,
    })),
  }))
}

export function toSiteConfig(row: DirectusSiteConfigRow, lang = 'en'): DirectusSiteConfig {
  const tr = resolveTranslation(row.translations ?? [], lang) as DirectusSiteConfigTranslationRow | null | undefined

  // Nav items come from the matching translation (per-language lists with single label)
  const navbarItems   = parseTrNavItems(tr?.navbar_items)
  const sidebarItems  = parseTrNavItems(tr?.sidebar_items)
  const mobileItems   = parseTrNavItems(tr?.mobile_nav_items)
  const footerColumns = parseTrFooterColumns(tr?.footer_columns)

  const navbarConfig: SiteNavbarConfig = {
    brandName:    row.navbar_brand_name ?? undefined,
    items:        navbarItems,
    ctaButton:    { href: row.navbar_cta_href ?? undefined, label: { en: 'Get Started' } },
    loginLabel:   { en: 'Login' },
    signupLabel:  { en: 'Sign up' },
    signoutLabel: { en: 'Sign out' },
  }

  const footerConfig: SiteFooterConfig = {
    brandName: row.footer_brand_name ?? undefined,
    columns:   footerColumns,
    tagline:   { en: '' },
    copyright: { en: '' },
  }

  const sidebarConfig: SiteSidebarConfig = {
    brandName:     row.sidebar_brand_name ?? undefined,
    brandSubtitle: row.sidebar_brand_subtitle ?? undefined,
    navItems:      sidebarItems,
    statusText:    undefined,
    statusBadge:   row.sidebar_status_badge ?? undefined,
  }

  const mobileNavConfig: SiteMobileNavConfig = {
    items: mobileItems,
  }

  return {
    _id:             row.id,
    _type:           'siteConfig',
    title:           row.site_name,
    siteName:        row.site_name,
    navbarConfig,
    footerConfig,
    sidebarConfig,
    mobileNavConfig,
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