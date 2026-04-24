/**
 * TypeScript types for the CMS layer (Directus).
 * Section/component content types are CMS-agnostic — they describe the JSON
 * blob shapes stored in pages.sections and are shared across all consumers.
 */

// ─── Shared ────────────────────────────────────────────────────────────────────

export type ImageAsset = {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number; height: number; width: number }
  url?: string // resolved via asset->url
}

export type PortableTextBlock = {
  _type: 'block'
  _key: string
  children: Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }>
  markDefs?: Array<{ _type: string; _key: string; [key: string]: unknown }>
  style?: string
}

// ─── Post ──────────────────────────────────────────────────────────────────────

export type PostRecord = {
  _id: string
  _type: 'post'
  _createdAt: string
  _updatedAt: string
  title: string
  slug: { current: string }
  language?: string
  excerpt?: string
  body?: PortableTextBlock[]
  coverImage?: ImageAsset
  publishedAt?: string
  featured?: boolean
  tags?: string[]
  authorId?: string
  authorName?: string
  authorEmail?: string
  authorAvatar?: string
}

/** Flat card shape returned by post list queries (coverImage is a resolved URL string). */
export type PostCard = Pick<
  PostRecord,
  | '_id'
  | 'title'
  | 'language'
  | 'excerpt'
  | 'publishedAt'
  | 'featured'
  | 'tags'
  | 'authorId'
  | 'authorName'
  | 'authorEmail'
  | 'authorAvatar'
> & {
  slug: string        // flattened from slug.current
  coverImage?: string // resolved URL
}

// ─── System section types (new schema) ────────────────────────────────────────

export type CtaButton = {
  label?: string
  href?: string
}

export type HeroSection = {
  _type: 'heroSection'
  _key: string
  heading: string
  subheading?: string
  badge?: string
  primaryCta?: CtaButton
  secondaryCta?: CtaButton
  layout?: 'centered' | 'split'
  /** Small social-proof line below CTAs — e.g. "Trusted by 2,000+ publishers". Split layout only. */
  communityText?: string
}

export type FeaturesFeature = {
  title: string
  description?: string
  icon?: string
}

export type FeaturesSection = {
  _type: 'featuresSection'
  _key: string
  heading?: string
  subheading?: string
  features?: FeaturesFeature[]
}

export type PostsSection = {
  _type: 'postsSection'
  _key: string
  heading?: string
  limit?: number
}

export type AuthSection = {
  _type: 'authSection'
  _key: string
  mode: 'login' | 'signup'
  heading?: string
  // Form copy — all optional with fallbacks in the component
  googleLabel?: string
  dividerLabel?: string
  nameLabel?: string
  namePlaceholder?: string
  emailLabel?: string
  emailPlaceholder?: string
  passwordLabel?: string
  passwordPlaceholder?: string
  submitLabel?: string
  footerText?: string
  footerLinkLabel?: string
  footerLinkHref?: string
  showGoogleOAuth?: boolean
  showEmailPassword?: boolean
}

export type AnalyticsSection = {
  _type: 'analyticsSection'
  _key: string
  heading?: string
}

export type NavbarLink = {
  label: string
  href: string
}

export type NavbarSection = {
  _type: 'navbarSection'
  _key: string
  logo?: string
  links?: NavbarLink[]
}

export type FooterLink = {
  label: string
  href: string
}

export type FooterSection = {
  _type: 'footerSection'
  _key: string
  tagline?: string
  copyright?: string
  links?: FooterLink[]
}

/** A dereferenced custom section document (from a reference in page.sections). */
export type CustomSection = {
  _type: 'section'
  _id: string
  title: string
  language?: string
}

// ─── Component document content types ────────────────────────────────────────
// These match the named sub-object fields in the `component` document schema.

// ── Layout chrome ─────────────────────────────────────────────────────────────

export type ComponentNavLink = { label: string; href: string; external?: boolean }

export type ComponentNavbarContent = {
  logoText?: string
  variant?: 'solid' | 'transparent' | 'blur'
  links?: ComponentNavLink[]
  ctaButton?: { label?: string; href?: string }
  showAuth?: boolean
}

export type ComponentFooterColumn = {
  heading: string
  links?: { label?: string; href?: string; external?: boolean }[]
}

export type ComponentFooterContent = {
  logoText?: string
  tagline?: string
  copyright?: string
  columns?: ComponentFooterColumn[]
  socialLinks?: { platform?: string; href?: string }[]
  showLogo?: boolean
}

export type ComponentSidebarNavItem = {
  label: string
  href: string
  icon?: string
  adminOnly?: boolean
}

export type ComponentSidebarContent = {
  logoText?: string
  logoHref?: string
  navItems?: ComponentSidebarNavItem[]
  footerItems?: ComponentSidebarNavItem[]
  collapsible?: boolean
  showUserProfile?: boolean
  defaultCollapsed?: boolean
}

export type ComponentMobileNavTopContent = {
  logoText?: string
  showLogo?: boolean
  showMenuButton?: boolean
  actions?: { type?: string; label?: string }[]
}

export type ComponentMobileNavBottomContent = {
  items?: { label: string; href: string; icon?: string; activeIcon?: string; adminOnly?: boolean }[]
  showLabels?: boolean
}

// ── Content blocks ────────────────────────────────────────────────────────────

export type ComponentFormField = {
  name?: string
  label?: string
  fieldType?: 'text' | 'email' | 'password' | 'textarea' | 'url' | 'tel' | 'select'
  placeholder?: string
  required?: boolean
  helperText?: string
  options?: { label?: string; value?: string }[]
}

export type ComponentFormContent = {
  heading?: string
  subheading?: string
  method?: 'post' | 'get'
  action?: string
  fields?: ComponentFormField[]
  submitLabel?: string
  successMessage?: string
}

export type ComponentGridItem = {
  heading: string
  body?: string
  icon?: string
  image?: ImageAsset & { url?: string }
  linkLabel?: string
  linkHref?: string
}

export type ComponentGridContent = {
  heading?: string
  subheading?: string
  columns?: 2 | 3 | 4
  cardStyle?: 'bordered' | 'filled' | 'plain' | 'elevated'
  items?: ComponentGridItem[]
}

export type ComponentCardItem = {
  heading: string
  body?: string
  badge?: string
  image?: ImageAsset & { url?: string }
  tags?: string[]
  ctaLabel?: string
  ctaHref?: string
}

export type ComponentCardsContent = {
  heading?: string
  layout?: 'grid-2' | 'grid-3' | 'featured' | 'horizontal'
  items?: ComponentCardItem[]
}

export type ComponentPricingPlan = {
  name: string
  description?: string
  monthlyPrice?: string
  yearlyPrice?: string
  priceNote?: string
  badge?: string
  highlighted?: boolean
  features?: { text: string; included?: boolean }[]
  ctaLabel?: string
  ctaHref?: string
}

export type ComponentPricingTableContent = {
  heading?: string
  subheading?: string
  currency?: string
  billingToggle?: boolean
  plans?: ComponentPricingPlan[]
}

export type ComponentDataTableColumn = {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

export type ComponentDataTableRow = {
  cells?: { key: string; value: string }[]
}

export type ComponentDataTableContent = {
  heading?: string
  description?: string
  columns?: ComponentDataTableColumn[]
  rows?: ComponentDataTableRow[]
  striped?: boolean
  bordered?: boolean
  pagination?: boolean
  pageSize?: number
}

export type ComponentListItem = {
  text: string
  description?: string
  icon?: string
  badge?: string
}

export type ComponentListContent = {
  heading?: string
  style?: 'bullet' | 'numbered' | 'checklist' | 'icon' | 'plain'
  columns?: 1 | 2 | 3
  items?: ComponentListItem[]
}

export type ComponentFlexItem = {
  heading?: string
  body?: string
  image?: ImageAsset & { url?: string }
  width?: string
}

export type ComponentFlexContent = {
  heading?: string
  direction?: 'row' | 'column'
  wrap?: boolean
  gap?: 'none' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  items?: ComponentFlexItem[]
}

/**
 * A fully dereferenced `component` document.
 * The `componentType` field is the discriminator; one of the named content
 * sub-objects will be populated depending on which type was selected.
 */
export type ComponentDoc = {
  _type:         'component'
  _id:           string
  name?:         string
  language?:     string
  componentType: string
  // Layout chrome
  navbar?:          ComponentNavbarContent          | null
  footer?:          ComponentFooterContent          | null
  sidebar?:         ComponentSidebarContent         | null
  mobileNavTop?:    ComponentMobileNavTopContent    | null
  mobileNavBottom?: ComponentMobileNavBottomContent | null
  // Content blocks
  form?:         ComponentFormContent         | null
  grid?:         ComponentGridContent         | null
  cards?:        ComponentCardsContent        | null
  pricingTable?: ComponentPricingTableContent | null
  dataTable?:    ComponentDataTableContent    | null
  list?:         ComponentListContent         | null
  flex?:         ComponentFlexContent         | null
}

// ─── Legacy section types (kept for backward compat with existing data) ────────

export type CtaSection = {
  _type: 'ctaSection'
  _key: string
  heading: string
  body?: string
  primaryButton?: CtaButton
  secondaryButton?: CtaButton
  theme?: 'dark' | 'indigo' | 'subtle'
  centered?: boolean
}

export type FeaturedPostsSection = {
  _type: 'featuredPostsSection'
  _key: string
  heading?: string
  subheading?: string
  maxPosts?: number
  layout?: 'grid' | 'list' | 'featured'
  showExcerpt?: boolean
  showTags?: boolean
  viewAllLabel?: string
}

export type RecentPostsSection = {
  _type: 'recentPostsSection'
  _key: string
  heading?: string
  subheading?: string
  count?: number
  layout?: 'grid' | 'list'
  showCoverImage?: boolean
  viewAllLabel?: string
  viewAllHref?: string
}

export type RichTextSection = {
  _type: 'richTextSection'
  _key: string
  heading?: string
  content: PortableTextBlock[]
  maxWidth?: 'narrow' | 'medium' | 'full'
}

export type StatItem = {
  value: string
  label: string
  description?: string
  useLivePostCount?: boolean
}

export type StatsSection = {
  _type: 'statsSection'
  _key: string
  heading?: string
  stats?: StatItem[]
}

export type FormField = {
  fieldId: string
  label: string
  placeholder?: string
  fieldType?: 'text' | 'email' | 'password' | 'textarea' | 'url'
  required?: boolean
  readOnly?: boolean
  helperText?: string
}

export type FormSection = {
  _type: 'formSection'
  _key: string
  formId: 'login' | 'signup' | 'profile'
  heading?: string
  subheading?: string
  showGoogleOAuth?: boolean
  showEmailPassword?: boolean
  fields?: FormField[]
  submitLabel?: string
  footerText?: string
  footerLinkLabel?: string
  footerLinkHref?: string
}

export type HeadingSection = {
  _type: 'headingSection'
  _key: string
  heading: string
  subheading?: string
  badge?: string
  align?: 'left' | 'center' | 'right'
  size?: 'h1' | 'h2' | 'h3'
}

export type Feature = {
  icon?: string
  title: string
  description?: string
}

export type FeatureListSection = {
  _type: 'featureListSection'
  _key: string
  heading?: string
  subheading?: string
  layout?: 'list' | 'grid-2' | 'grid-3'
  features?: Feature[]
}

export type Testimonial = {
  quote: string
  name: string
  title?: string
  avatar?: ImageAsset
  rating?: number
}

export type TestimonialsSection = {
  _type: 'testimonialsSection'
  _key: string
  heading?: string
  testimonials?: Testimonial[]
  layout?: 'grid' | 'carousel' | 'single'
}

export type FaqItem = {
  question: string
  answer: PortableTextBlock[]
}

export type FaqSection = {
  _type: 'faqSection'
  _key: string
  heading?: string
  subheading?: string
  faqs?: FaqItem[]
  layout?: 'accordion' | 'open' | 'two-col'
}

export type PricingPlan = {
  name: string
  price?: string
  priceNote?: string
  description?: string
  badge?: string
  highlighted?: boolean
  features?: { text: string; included?: boolean }[]
  ctaLabel?: string
  ctaHref?: string
}

export type PricingSection = {
  _type: 'pricingSection'
  _key: string
  heading?: string
  subheading?: string
  plans?: PricingPlan[]
}

export type TeamMember = {
  name: string
  role?: string
  bio?: string
  avatar?: ImageAsset
  linkedIn?: string
  twitter?: string
}

export type TeamSection = {
  _type: 'teamSection'
  _key: string
  heading?: string
  subheading?: string
  members?: TeamMember[]
  columns?: 2 | 3 | 4
}

export type LogoBarSection = {
  _type: 'logoBarSection'
  _key: string
  heading?: string
  logos?: { image: ImageAsset; alt: string; href?: string }[]
  scrolling?: boolean
}

export type CarouselSlide = {
  image?: ImageAsset
  heading?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
}

export type CarouselSection = {
  _type: 'carouselSection'
  _key: string
  heading?: string
  slides?: CarouselSlide[]
  autoplay?: boolean
  showDots?: boolean
  showArrows?: boolean
}

export type TableSection = {
  _type: 'tableSection'
  _key: string
  heading?: string
  headers: string[]
  rows?: { cells: string[] }[]
  striped?: boolean
  bordered?: boolean
}

export type TimelineEvent = {
  date: string
  title: string
  description?: string
  icon?: string
  highlight?: boolean
}

export type TimelineSection = {
  _type: 'timelineSection'
  _key: string
  heading?: string
  events?: TimelineEvent[]
  orientation?: 'vertical' | 'horizontal'
}

export type BannerSection = {
  _type: 'bannerSection'
  _key: string
  text: string
  ctaLabel?: string
  ctaHref?: string
  dismissible?: boolean
  color?: 'indigo' | 'amber' | 'red' | 'emerald'
}

export type TabsItem = {
  label: string
  icon?: string
  content?: PortableTextBlock[]
  image?: ImageAsset
}

export type TabsSection = {
  _type: 'tabsSection'
  _key: string
  heading?: string
  tabs?: TabsItem[]
}

export type ImageSection = {
  _type: 'imageSection'
  _key: string
  image: ImageAsset
  alt: string
  caption?: string
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full'
  rounded?: boolean
  shadow?: boolean
}

export type GalleryImage = {
  image: ImageAsset
  alt: string
  caption?: string
}

export type GallerySection = {
  _type: 'gallerySection'
  _key: string
  heading?: string
  images: GalleryImage[]
  layout?: 'masonry' | 'grid' | 'carousel'
  columns?: 2 | 3 | 4
  lightbox?: boolean
}

export type VideoSection = {
  _type: 'videoSection'
  _key: string
  heading?: string
  subheading?: string
  url: string
  posterImage?: ImageAsset
  maxWidth?: 'medium' | 'wide' | 'full'
}

export type NewsletterSection = {
  _type: 'newsletterSection'
  _key: string
  heading?: string
  subheading?: string
  placeholder?: string
  buttonLabel?: string
  successMessage?: string
  privacyText?: string
  layout?: 'centered' | 'split' | 'bar'
}

export type ContactFormField = {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
}

export type ContactSection = {
  _type: 'contactSection'
  _key: string
  heading?: string
  subheading?: string
  email?: string
  phone?: string
  address?: string
  showForm?: boolean
  formFields?: ContactFormField[]
  submitLabel?: string
  successMessage?: string
}

export type AuthHeroFeature = {
  _key?: string
  icon?: string
  text: string
}

export type AuthHeroSection = {
  _type: 'authHeroSection'
  _key: string
  headline?: string
  badge?: string
  features?: AuthHeroFeature[]
  footerNote?: string
}

export type LoginSection = {
  _type: 'loginSection'
  _key: string
  heading?: string
  subheading?: string
  badge?: string | null
}

export type SignupSection = {
  _type: 'signupSection'
  _key: string
  heading?: string
  subheading?: string
  badge?: string | null
}

export type NotFoundSection = {
  _type: 'notFoundSection'
  _key: string
  heading?: string
  subheading?: string
  ctaLabel?: string
  ctaHref?: string
  showSearch?: boolean
}

export type GridCard = {
  heading: string
  body?: string
  image?: ImageAsset
  icon?: string
  linkLabel?: string
  linkHref?: string
}

export type GridSection = {
  _type: 'gridSection'
  _key: string
  heading?: string
  subheading?: string
  columns?: 2 | 3 | 4
  items?: GridCard[]
  cardStyle?: 'bordered' | 'filled' | 'plain'
}

export type ColumnsSection = {
  _type: 'columnsSection'
  _key: string
  left?: PortableTextBlock[]
  right?: PortableTextBlock[]
  ratio?: '1/1' | '3/2' | '2/3' | '7/3'
  reverseOnMobile?: boolean
}

export type SpacerSection = {
  _type: 'spacerSection'
  _key: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export type DividerSection = {
  _type: 'dividerSection'
  _key: string
  style?: 'line' | 'dots' | 'invisible'
}

// ─── Legacy app-page marker sections ──────────────────────────────────────────

export type PostsPageSection    = { _type: 'postsPageSection';    _key: string }
export type AnalyticsPageSection= { _type: 'analyticsPageSection';_key: string }
export type SettingsPageSection = { _type: 'settingsPageSection'; _key: string }
export type BillingPageSection  = { _type: 'billingPageSection';  _key: string }
export type AdminPageSection    = { _type: 'adminPageSection';    _key: string }
export type LoginPageSection    = { _type: 'loginPageSection';    _key: string; heading?: string; description?: string }
export type SignupPageSection   = { _type: 'signupPageSection';   _key: string; heading?: string; description?: string }
export type PostDetailPageSection = { _type: 'postDetailPageSection'; _key: string; heading?: string; description?: string }

// ─── Section document content sub-objects ─────────────────────────────────────

export type SectionHeroContent = Omit<HeroSection, '_type' | '_key'>
export type SectionFeaturedPostsContent = Omit<FeaturedPostsSection, '_type' | '_key'>
export type SectionRecentPostsContent = Omit<RecentPostsSection, '_type' | '_key'> & {
  filterTags?: string[]
}
export type SectionCtaContent = Omit<CtaSection, '_type' | '_key'>

export type SectionAuthHeroContent = {
  badge?: string
  headline?: string
  features?: AuthHeroFeature[]
  footerNote?: string
}

export type SectionAuthFormContent = Omit<AuthSection, '_type' | '_key'>

export type SectionFeaturesContent = Omit<FeaturesSection, '_type' | '_key'>

/** @deprecated Use the 5 split section types below. */
export type SectionPostDetailContent = {
  showAuthor?: boolean
  showPublishedAt?: boolean
  showTags?: boolean
}

// ── Post Detail sub-section content types ─────────────────────────────────────

export type SectionPostDetailHeaderContent = {
  heading?:            string
  featuredBadgeLabel?: string
  languageBadgeLabel?: string
  editInStudioLabel?:  string
}

export type SectionPostDetailMetaContent = {
  authorLabel?:      string
  dateFormatLabel?:  string
  unpublishedLabel?: string
}

export type SectionPostDetailBodyContent = {
  emptyBodyText?:  string
  shareLabel?:     string
  linkCopiedText?: string
}

export type SectionPostDetailTagsContent = {
  tagsHeading?:   string
  emptyTagsText?: string
}

export type SectionPostDetailBackLinkContent = {
  backLabel?:     string
  allPostsLabel?: string
  prevLabel?:     string
  nextLabel?:     string
  backHref?:      string
}

/** Thin marker used by sections that have no CMS-editable copy (postsList). */
export type SectionMarker = { heading?: string; limit?: number }

// ── Billing sub-section content types ─────────────────────────────────────────

export type SectionBillingHeaderContent = {
  heading?:    string
  subheading?: string
}

export type SectionBillingCurrentPlanContent = {
  currentPlanLabel?:     string
  activeBadgeLabel?:     string
  cancellingBadgeLabel?: string
  freeTierBadgeLabel?:   string
  manageLabel?:          string
  cancelLabel?:          string
  reactivateLabel?:      string
  upgradeLabel?:         string
  cancellingNote?:       string
}

export type SectionBillingUsageContent = {
  usageHeading?:      string
  postsUsageLabel?:   string
  apiUsageLabel?:     string
  storageUsageLabel?: string
  seatsUsageLabel?:   string
}

export type SectionBillingPlansGridContent = {
  plansHeading?:           string
  freePlanName?:           string
  freePlanTagline?:        string
  freePlanPrice?:          string
  freePlanFeatures?:       string[]
  proPlanName?:            string
  proPlanTagline?:         string
  proPlanBadge?:           string
  proPlanFeatures?:        string[]
  upgradeLabel?:           string
  upgradeCta?:             string
  downgradeCta?:           string
  currentPlanBtn?:         string
  downgradeLabel?:         string
  downgradeScheduledLabel?: string
  currentPlanButtonLabel?: string
}

export type SectionBillingFooterContent = {
  stripeNote?:  string
  webhookNote?: string
}

export type SectionBillingSuccessHeroContent = {
  icon?:       string
  heading?:    string
  subheading?: string
  body?:       string
}

export type SectionBillingSuccessActionsContent = {
  primaryLabel?:   string
  primaryHref?:    string
  secondaryLabel?: string
  secondaryHref?:  string
}

// ── Settings sub-section content types ────────────────────────────────────────

export type SectionSettingsHeaderContent = {
  heading?:    string
  subheading?: string
}

export type SectionSettingsInfoContent = {
  uploadPhotoLabel?: string
}

export type SectionSettingsFormContent = {
  profileSectionLabel?: string
  metadataLabel?:        string
  displayNameLabel?:     string
  emailLabel?:           string
  emailHelperText?:      string
  bioLabel?:             string
  bioPlaceholder?:       string
  bioMaxLength?:         number
  websiteLabel?:         string
  websitePlaceholder?:   string
  websiteErrorText?:     string
  saveLabel?:            string
  discardLabel?:         string
}

export type SectionSettingsDangerContent = {
  heading?:     string
  body?:        string
  warningText?: string
  deleteLabel?: string
}

// ── Posts page sub-section content types ─────────────────────────────────────

export type SectionPostsHeaderContent = {
  heading?:        string
  subheading?:     string
  /** Badge label shown next to the section heading (e.g. "via Directus"). */
  apiBadgeLabel?:  string
}

export type SectionPostsStatsContent = {
  myPostsLabel?:   string
  publishedLabel?: string
  draftsLabel?:    string
}

export type SectionPostsActionsContent = {
  syncButtonLabel?:    string
  newPostButtonLabel?: string
}

export type SectionPostsSearchContent = {
  searchPlaceholder?: string
}

export type SectionPostsTableContent = {
  colTitle?:        string
  colStatus?:       string
  colImage?:        string
  colTags?:         string
  colLastModified?: string
  emptyTitle?:      string
  emptyBody?:       string
  emptyCtaLabel?:   string
  showingLabel?:    string
  loadMoreLabel?:   string
  connectedLabel?:  string
  // Row action labels
  viewPostLabel?:           string
  editPostLabel?:           string
  deletePostLabel?:         string
  // Delete confirmation dialog labels
  deleteDialogTitle?:       string
  deleteDialogBody?:        string
  deleteDialogConfirmLabel?: string
  deleteDialogCancelLabel?:  string
  // Featured banner — full configuration
  featuredLabel?:      string
  featuredOfLabel?:    string
  featuredReadLabel?:  string
  featuredBannerIcon?: string
}

/** Rich content model for the /admin page section. */
export type SectionAdminContent = {
  // Users table
  heading?:         string
  subheading?:      string
  totalUsersLabel?: string
  proLabel?:        string
  freeLabel?:       string
  colUser?:         string
  colPlan?:         string
  colRole?:         string
  colJoined?:       string
  emptyLabel?:      string
  footerNote?:      string
  // Invite / access-request workflow
  inviteSectionHeading?:   string
  inviteFormTitle?:        string
  inviteEmailLabel?:       string
  inviteEmailPlaceholder?: string
  inviteMessageLabel?:     string
  inviteSendLabel?:        string
  pendingInvitesHeading?:  string
  inviteEmptyLabel?:       string
  cancelInviteLabel?:      string
  pendingRequestsHeading?: string
  requestEmptyLabel?:      string
  approveLabel?:           string
  rejectLabel?:            string
  colEmail?:               string
  colType?:                string
  colSentAt?:              string
  colActions?:             string
}

/** Rich content model for the /analytics page section. */
export type SectionAnalyticsContent = {
  heading?:                string
  subheading?:             string
  eventsLabel?:            string
  usersLabel?:             string
  avgSessionLabel?:        string
  liveStreamLabel?:        string
  refreshLabel?:           string
  emptyTitle?:             string
  emptyBody?:              string
  featureFlagLabel?:       string
  featureFlagEnabledNote?: string
  featureFlagDisabledNote?: string
  connectedLabel?:         string
  ctaLabel?:               string
  // Pagination labels
  showingLabel?:           string
  prevLabel?:              string
  nextLabel?:              string
}

/**
 * A dereferenced `section` document.
 * The `sectionType` field is the discriminator; one of the named content
 * sub-objects will be populated depending on which type was selected.
 */
export type PageSection = {
  _type:       'section'
  _id:         string
  sectionType: string
  title?:      string
  language?:   string
  // Content sub-objects — only the matching one will be non-null
  hero?:            SectionHeroContent | null
  featuredPosts?:   SectionFeaturedPostsContent | null
  recentPosts?:     SectionRecentPostsContent | null
  cta?:             SectionCtaContent | null
  authHero?:        SectionAuthHeroContent | null
  authForm?:        SectionAuthFormContent | null
  features?:        SectionFeaturesContent | null
  postsList?:       SectionMarker | null
  postDetail?:      SectionPostDetailContent | null
  // Post Detail sub-sections
  postDetailHeader?:   SectionPostDetailHeaderContent | null
  postDetailMeta?:     SectionPostDetailMetaContent | null
  postDetailBody?:     SectionPostDetailBodyContent | null
  postDetailTags?:     SectionPostDetailTagsContent | null
  postDetailBackLink?: SectionPostDetailBackLinkContent | null
  // Posts sub-sections
  postsHeader?:     SectionPostsHeaderContent | null
  postsStats?:      SectionPostsStatsContent | null
  postsActions?:    SectionPostsActionsContent | null
  postsSearch?:     SectionPostsSearchContent | null
  postsTable?:      SectionPostsTableContent | null
  analytics?:          SectionAnalyticsContent | null
  // Billing sub-sections
  billingHeader?:      SectionBillingHeaderContent | null
  billingCurrentPlan?: SectionBillingCurrentPlanContent | null
  billingUsage?:       SectionBillingUsageContent | null
  billingPlansGrid?:   SectionBillingPlansGridContent | null
  billingFooter?:      SectionBillingFooterContent | null
  billingSuccessHero?:    SectionBillingSuccessHeroContent | null
  billingSuccessActions?: SectionBillingSuccessActionsContent | null
  // Settings sub-sections
  settingsHeader?:     SectionSettingsHeaderContent | null
  settingsInfo?:       SectionSettingsInfoContent | null
  settingsForm?:       SectionSettingsFormContent | null
  settingsDanger?:     SectionSettingsDangerContent | null
  admin?:              SectionAdminContent | null
}

// ─── CmsSection union ─────────────────────────────────────────────────────────

export type CmsSection =
  // Section document type (sections[]-> dereferenced)
  | PageSection
  // Component document type (sections[]-> dereferenced)
  | ComponentDoc
  // System sections
  | HeroSection
  | FeaturesSection
  | PostsSection
  | AuthSection
  | AnalyticsSection
  | NavbarSection
  | FooterSection
  | CustomSection
  // Legacy sections (still in existing data)
  | CtaSection
  | FeaturedPostsSection
  | RecentPostsSection
  | RichTextSection
  | StatsSection
  | FormSection
  | HeadingSection
  | FeatureListSection
  | TestimonialsSection
  | FaqSection
  | PricingSection
  | TeamSection
  | LogoBarSection
  | CarouselSection
  | TableSection
  | TimelineSection
  | BannerSection
  | TabsSection
  | ImageSection
  | GallerySection
  | VideoSection
  | NewsletterSection
  | ContactSection
  | AuthHeroSection
  | LoginSection
  | SignupSection
  | NotFoundSection
  | GridSection
  | ColumnsSection
  | SpacerSection
  | DividerSection
  | PostsPageSection
  | AnalyticsPageSection
  | SettingsPageSection
  | BillingPageSection
  | AdminPageSection
  | LoginPageSection
  | SignupPageSection
  | PostDetailPageSection

// ─── Page ──────────────────────────────────────────────────────────────────────

export type PageRecord = {
  _id: string
  _type: 'page'
  title: string
  slug: { current: string }
  language?: string
  access?: 'guest' | 'user' | 'admin'
  layout?: 'home' | 'dashboard' | 'auth'
  sections?: CmsSection[]
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
}

// ─── Site config ───────────────────────────────────────────────────────────────

// ── Shared primitives ─────────────────────────────────────────────────────────

/** Audience roles used for nav item visibility filtering. */
export type NavRole = 'guest' | 'user' | 'admin'

/** Multilingual label object for nav items. */
export type SiteNavItemLabel = {
  en: string
  hi?: string
  kn?: string
}

/** Unified nav item — used across navbar, sidebar, and mobile nav. */
export type SiteNavItem = {
  _key: string
  label:      SiteNavItemLabel
  href:       string
  icon?:      string      // Lucide icon name (e.g. "FileText", "Settings")
  visibleFor?: NavRole[]  // roles that can see this item; empty = hidden from all
}

/** Utility CTA button used in several layout zones */
export type SiteCtaButton = {
  label?: string | SiteNavItemLabel
  href?:  string
}

/** Generic link with optional new-tab flag */
export type SiteLink = {
  _key:     string
  label:    string | SiteNavItemLabel
  href:     string
  external?: boolean
}

/** Footer link column */
export type SiteFooterColumn = {
  _key:    string
  heading: string | SiteNavItemLabel
  links?:  SiteLink[]
}

/** Social media link */
export type SiteSocialLink = {
  _key:     string
  platform: 'twitter' | 'github' | 'linkedin' | 'youtube' | 'instagram' | string
  label?:   string
  href?:    string
}

/** Sidebar footer utility link (Documentation, Support, etc.) */
export type SiteSidebarFooterLink = {
  _key:     string
  label:    string | SiteNavItemLabel
  href:     string
  icon?:    string
  external?: boolean
}

// ── Layout zone configs ───────────────────────────────────────────────────────

export type SiteNavbarConfig = {
  brandName?:            string
  showLanguageSwitcher?: boolean
  ctaButton?:            SiteCtaButton
  items?:                SiteNavItem[]
  loginLabel?:           SiteNavItemLabel
  signupLabel?:          SiteNavItemLabel
  signoutLabel?:         SiteNavItemLabel
  mobileLanguageLabel?:  SiteNavItemLabel
}

export type SiteFooterConfig = {
  brandName?:   string
  showBrandLogo?: boolean
  tagline?:     string | SiteNavItemLabel
  socialLinks?: SiteSocialLink[]
  columns?:     SiteFooterColumn[]
  copyright?:   string | SiteNavItemLabel
  bottomLinks?: SiteLink[]
}

export type SiteSidebarConfig = {
  brandName?:    string
  brandSubtitle?: string
  navItems?:     SiteNavItem[]
  ctaButton?:    SiteCtaButton
  footerLinks?:  SiteSidebarFooterLink[]
  statusText?:   string
  statusBadge?:  string
}

export type SiteMobileNavConfig = {
  showLabels?: boolean
  items?:      SiteNavItem[]
}

// ── SiteConfig ────────────────────────────────────────────────────────────────

export type SiteConfig = {
  _id:      string
  _type:    'siteConfig'
  title:    string
  siteName: string
  navbarConfig?:    SiteNavbarConfig
  footerConfig?:    SiteFooterConfig
  sidebarConfig?:   SiteSidebarConfig
  mobileNavConfig?: SiteMobileNavConfig
  // Legacy optional fields — kept for backward compat
  language?: string
  tagline?:  string
  logo?:     ImageAsset
  favicon?:  ImageAsset
  publicNav?:    NavLink[]
  sidebarNav?:   SidebarNavLink[]
  footerTagline?: string
  footerLinks?: { label: string; href: string }[]
  copyright?: string
  /** ID of the resolved site_config_translations row (for visual editing bindings). */
  siteConfigTranslationId?: number
}

// ─── Shared nav / link types ──────────────────────────────────────────────────

/**
 * Lightweight page stub for nav generation.
 */
export type NavPage = {
  _id:    string
  title:  string
  slug:   string
  access: 'guest' | 'user' | 'admin'
  layout: 'home' | 'auth' | 'dashboard'
}

export type NavLink = {
  label: string
  href?: string
  slug?: string
  openInNewTab?: boolean
}

export type SidebarNavLink = {
  label: string
  href: string
  icon?: string
  adminOnly?: boolean
}

export type AuthFeatureBullet = {
  text: string
  icon?: string
}
