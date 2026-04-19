/**
 * types/directus.ts
 *
 * TypeScript types for the Directus CMS layer.
 *
 * Strategy:
 *  - DirectusPost / DirectusPage / DirectusSiteConfig are the normalised shapes
 *    returned by lib/directus/queries.ts — same field names consumers expect.
 *  - All section/component content sub-types are RE-EXPORTED from types/cms.ts —
 *    they describe JSON blob shapes stored in pages.sections and are CMS-agnostic.
 *  - DirectusSchema powers the @directus/sdk generic so the client is typed.
 */

// ─── Re-export all section & component content types (unchanged) ──────────────
// These types describe the shape of the JSON stored inside pages.sections —
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

/**
 * Row returned by Directus `posts` collection.
 * Field names match Directus (snake_case). A toPost() helper normalises to
 * the camelCase shape consumers expect.
 */
export type DirectusPostRow = {
  id:           string
  title:        string
  slug:         string
  language:     string
  excerpt:      string | null
  body:         unknown[] | null       // PortableText block array stored as JSON
  cover_image:  string | null          // direct URL
  published_at: string | null          // ISO datetime; null = draft
  featured:     boolean
  tags:         string[] | null
  author_id:    string | null
  author_name:  string | null
  author_email: string | null
  author_avatar:string | null          // direct URL
  date_created: string
  date_updated: string
}

/**
 * Normalised post shape consumed by PostsTable, PostDetail, PostsListing, etc.
 */
export type DirectusPost = {
  _id:          string          // ← id
  _type:        'post'
  _createdAt:   string          // ← date_created
  _updatedAt:   string          // ← date_updated
  title:        string
  slug:         string          // flat string
  language?:    string
  excerpt?:     string
  body?:        unknown[]
  coverImage?:  string          // direct URL
  publishedAt?: string
  featured?:    boolean
  tags?:        string[]
  authorId?:    string
  authorName?:  string
  authorEmail?: string
  authorAvatar?:string
}

/** Converts a raw Directus row to the normalised DirectusPost shape. */
export function toPost(row: DirectusPostRow): DirectusPost {
  return {
    _id:          row.id,
    _type:        'post',
    _createdAt:   row.date_created,
    _updatedAt:   row.date_updated,
    title:        row.title,
    slug:         row.slug,
    language:     row.language ?? undefined,
    excerpt:      row.excerpt ?? undefined,
    body:         row.body ?? undefined,
    coverImage:   row.cover_image ?? undefined,
    publishedAt:  row.published_at ?? undefined,
    featured:     row.featured,
    tags:         row.tags ?? undefined,
    authorId:     row.author_id ?? undefined,
    authorName:   row.author_name ?? undefined,
    authorEmail:  row.author_email ?? undefined,
    authorAvatar: row.author_avatar ?? undefined,
  }
}

/**
 * Row returned by Directus `pages` collection.
 * sections is stored as a JSON array — same structure SectionRenderer already handles.
 */
export type DirectusPageRow = {
  id:              string
  title:           string
  slug:            string
  language:        string
  access:          'guest' | 'user' | 'admin'
  layout:          'home' | 'dashboard' | 'auth'
  sections:        CmsSection[] | null
  seo_title:       string | null
  seo_description: string | null
  og_image:        string | null
  status:          'published' | 'draft'
}

/**
 * Normalised page shape consumed by page routes and SectionRenderer.
 */
export type DirectusPage = {
  _id:            string
  _type:          'page'
  title:          string
  slug:           { current: string }   // kept as object for drop-in compat
  language?:      string
  access?:        'guest' | 'user' | 'admin'
  layout?:        'home' | 'dashboard' | 'auth'
  sections?:      CmsSection[]
  seoTitle?:      string
  seoDescription?:string
  ogImage?:       string
}

/** Converts a raw Directus page row to the normalised DirectusPage shape. */
export function toPage(row: DirectusPageRow): DirectusPage {
  return {
    _id:             row.id,
    _type:           'page',
    title:           row.title,
    slug:            { current: row.slug },
    language:        row.language ?? undefined,
    access:          row.access,
    layout:          row.layout,
    sections:        (row.sections ?? undefined) as CmsSection[] | undefined,
    seoTitle:        row.seo_title ?? undefined,
    seoDescription:  row.seo_description ?? undefined,
    ogImage:         row.og_image ?? undefined,
  }
}

/** Lightweight nav page stub for Navbar generation. */
export type DirectusNavPage = {
  _id:    string
  title:  string
  slug:   string
  access: 'guest' | 'user' | 'admin'
  layout: 'home' | 'auth' | 'dashboard'
}

/**
 * Row returned by Directus `site_config` singleton (id = 'site-config').
 */
export type DirectusSiteConfigRow = {
  id:               string
  site_name:        string
  navbar_config:    SiteNavbarConfig | null
  footer_config:    SiteFooterConfig | null
  sidebar_config:   SiteSidebarConfig | null
  mobile_nav_config:SiteMobileNavConfig | null
}

/**
 * Normalised site config consumed by Navbar, Footer, and Sidebar components.
 */
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
    _id:              row.id,
    _type:            'siteConfig',
    title:            row.site_name,
    siteName:         row.site_name,
    navbarConfig:     row.navbar_config ?? undefined,
    footerConfig:     row.footer_config ?? undefined,
    sidebarConfig:    row.sidebar_config ?? undefined,
    mobileNavConfig:  row.mobile_nav_config ?? undefined,
  }
}

// ─── Directus SDK schema (used for client generic) ────────────────────────────
// Collections must be typed as arrays for the SDK v16+ generics.
export type DirectusSchema = {
  posts:       DirectusPostRow[]
  pages:       DirectusPageRow[]
  site_config: DirectusSiteConfigRow[]
}
