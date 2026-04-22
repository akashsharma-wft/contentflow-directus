/**
 * types/directus.ts
 *
 * TypeScript types for the Directus CMS layer.
 *
 * Strategy:
 *  - DirectusPost / DirectusPage / DirectusSiteConfig are the normalised shapes
 *    returned by lib/directus/queries.ts — same field names consumers expect.
 *  - All section/component content sub-types are RE-EXPORTED from types/cms.ts —
 *    they describe JSON blob shapes stored in pages_translations.sections and are CMS-agnostic.
 *  - DirectusSchema powers the @directus/sdk generic so the client is typed.
 *
 * Multilingual architecture (Phase A — Directus-native translations):
 *  - posts / pages hold non-translatable fields (slug, author_*, layout, access, …)
 *  - posts_translations / pages_translations hold per-language content (title, body, sections, …)
 *  - mergePost(row, preferLang) / mergePage(row, preferLang) pick the best translation
 *    and return the flat normalised shape consumers already expect.
 *  - During the transition period the old root-level title/language/body/sections fields
 *    are still present on rows (hidden in UI) — the merge helpers fall back to them so
 *    legacy seeded content continues to work before re-seeding.
 */

// ─── Re-export all section & component content types (unchanged) ──────────────
// These types describe the shape of the JSON stored inside pages_translations.sections —
// they are independent of which CMS delivers that JSON.
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

// ─── Directus-native types ────────────────────────────────────────────────────

import type { CmsSection, SiteNavbarConfig, SiteFooterConfig, SiteSidebarConfig, SiteMobileNavConfig } from '@/types/cms'
import { resolveTranslation } from '@/lib/directus/translations'

// ─── Languages ────────────────────────────────────────────────────────────────

export type DirectusLanguageRow = {
  code:      string   // 'en' | 'hi' | 'kn'
  name:      string
  direction: 'ltr' | 'rtl'
}

// ─── Posts translations ───────────────────────────────────────────────────────

/** One language variant of a post — lives in posts_translations. */
export type DirectusPostTranslationRow = {
  id:              number
  posts_id:        string
  languages_code:  string
  title:           string
  excerpt:         string | null
  body:            unknown[] | null
  seo_title:       string | null
  seo_description: string | null
}

/**
 * Row returned by Directus `posts` collection (with optional nested translations).
 *
 * Non-translatable fields (slug, author_*, cover_image, …) live here.
 * Translatable fields (title, excerpt, body) have been moved to posts_translations;
 * the optional root-level copies below are kept for backward compat with legacy rows
 * that were seeded before the translations migration.
 */
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
  // Nested translations (populated when fields=['*','translations.*'])
  translations?: DirectusPostTranslationRow[]
  // Legacy root-level fields (hidden in UI; kept for backward compat)
  title?:    string
  language?: string
  excerpt?:  string | null
  body?:     unknown[] | null
}

/**
 * Normalised post shape consumed by PostsTable, PostDetail, PostsListing, etc.
 * Field names unchanged from before so no consumer changes are needed.
 */
export type DirectusPost = {
  _id:                   string
  _type:                 'post'
  _createdAt:            string
  _updatedAt:            string
  title:                 string
  slug:                  string
  language?:             string
  excerpt?:              string
  body?:                 unknown[]
  coverImage?:           string
  publishedAt?:          string
  featured?:             boolean
  tags?:                 string[]
  authorId?:             string
  authorName?:           string
  authorEmail?:          string
  authorAvatar?:         string
  /** ID of the matched posts_translations row — used for visual editing data-directus attrs. */
  resolvedTranslationId?: number
}

/**
 * Merge a post parent row with its nested translations, preferring `preferLang`
 * then falling back to 'en', then to root-level legacy fields.
 */
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
    excerpt:               (tr?.excerpt     ?? row.excerpt  ?? undefined) ?? undefined,
    body:                  (tr?.body        ?? row.body     ?? undefined) ?? undefined,
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

/** Backward-compat alias — picks English translation. */
export function toPost(row: DirectusPostRow): DirectusPost {
  return mergePost(row, 'en')
}

// ─── Pages translations ───────────────────────────────────────────────────────

/** One language variant of a page — lives in pages_translations. */
export type DirectusPageTranslationRow = {
  id:              number
  pages_id:        string
  languages_code:  string
  title:           string
  sections:        CmsSection[] | null
  seo_title:       string | null
  seo_description: string | null
}

/**
 * Row returned by Directus `pages` collection (with optional nested translations).
 *
 * Non-translatable fields live here; translatable fields moved to pages_translations.
 * Legacy root-level copies kept for backward compat.
 */
export type DirectusPageRow = {
  id:       string
  slug:     string
  status:   'published' | 'draft'
  access:   'guest' | 'user' | 'admin'
  layout:   'home' | 'dashboard' | 'auth'
  og_image: string | null
  // Nested translations (populated when fields=['*','translations.*'])
  translations?: DirectusPageTranslationRow[]
  // Legacy root-level fields (hidden in UI; kept for backward compat)
  title?:           string
  language?:        string
  sections?:        CmsSection[] | null
  seo_title?:       string | null
  seo_description?: string | null
}

/**
 * Normalised page shape consumed by page routes and SectionRenderer.
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
  /** ID of the matched pages_translations row — used for visual editing data-directus attrs. */
  resolvedTranslationId?: number
}

/**
 * Merge a page parent row with its nested translations, preferring `preferLang`
 * then falling back to 'en', then to root-level legacy fields.
 */
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
  }
}

/** Backward-compat alias — picks English translation. */
export function toPage(row: DirectusPageRow): DirectusPage {
  return mergePage(row, 'en')
}

/** Lightweight nav page stub for Navbar generation. */
export type DirectusNavPage = {
  _id:    string
  title:  string
  slug:   string
  access: 'guest' | 'user' | 'admin'
  layout: 'home' | 'auth' | 'dashboard'
}

// ─── Site config ──────────────────────────────────────────────────────────────

/** Row returned by Directus `site_config` singleton (id = 'site-config'). */
export type DirectusSiteConfigRow = {
  id:                string
  site_name:         string
  navbar_config:     SiteNavbarConfig | null
  footer_config:     SiteFooterConfig | null
  sidebar_config:    SiteSidebarConfig | null
  mobile_nav_config: SiteMobileNavConfig | null
}

/** Normalised site config consumed by Navbar, Footer, and Sidebar components. */
export type DirectusSiteConfig = {
  _id:              string
  _type:            'siteConfig'
  title:            string
  siteName:         string
  navbarConfig?:    SiteNavbarConfig
  footerConfig?:    SiteFooterConfig
  sidebarConfig?:   SiteSidebarConfig
  mobileNavConfig?: SiteMobileNavConfig
}

export function toSiteConfig(row: DirectusSiteConfigRow): DirectusSiteConfig {
  return {
    _id:             row.id,
    _type:           'siteConfig',
    title:           row.site_name,
    siteName:        row.site_name,
    navbarConfig:    row.navbar_config    ?? undefined,
    footerConfig:    row.footer_config    ?? undefined,
    sidebarConfig:   row.sidebar_config   ?? undefined,
    mobileNavConfig: row.mobile_nav_config ?? undefined,
  }
}

// ─── Directus SDK schema (used for client generic) ────────────────────────────
export type DirectusSchema = {
  posts:               DirectusPostRow[]
  posts_translations:  DirectusPostTranslationRow[]
  pages:               DirectusPageRow[]
  pages_translations:  DirectusPageTranslationRow[]
  languages:           DirectusLanguageRow[]
  site_config:         DirectusSiteConfigRow[]
}
