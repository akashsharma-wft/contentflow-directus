# ContentFlow — Claude Code Reference

## Project Overview

ContentFlow is a **CMS-driven SaaS dashboard** built as an internship assignment. It combines a public marketing/blog site with a protected user dashboard, all powered by Directus for content management.

- **Live demo**: https://contentflow--akash-sharma-weframetech.vercel.app
- **Stack**: Next.js 16.2.1 (App Router), React 19, @directus/sdk 21, Supabase Auth, Stripe, PostHog
- **Languages**: TypeScript strict mode throughout
- **Path alias**: `@/` maps to project root

---

## Complete Directory Tree

```
contentflow/
├── app/
│   ├── layout.tsx                        # Root layout — Providers, Toaster. No Navbar/Footer (each page controls its own)
│   ├── page.tsx                          # English homepage (/). Fetches 'home' page from Directus, renders with Navbar+Footer
│   ├── [lang]/
│   │   ├── page.tsx                      # Polymorphic: lang homepages (/hi, /kn), EN slug pages (/login, /signup, /posts, etc.), EN post detail
│   │   └── [slug]/
│   │       └── page.tsx                  # Post detail with language variants. Renders <PostDetail> in <DashboardLayout>
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                  # OAuth (Google) + email OTP callback. Handles `code` (OAuth) and `token_hash` (email verify)
│   └── api/
│       ├── posts/
│       │   ├── route.ts                  # POST: Create post. Checks subscription limit (free=5, pro=unlimited). Stores image URL
│       │   └── [id]/route.ts             # PATCH/DELETE: Single post update or delete
│       ├── create-checkout-session/
│       │   └── route.ts                  # POST: Creates Stripe checkout session. Requires auth + valid plan
│       ├── stripe/
│       │   ├── prices/route.ts           # GET: Fetches active Stripe prices. Returns empty array if Stripe not configured
│       │   ├── cancel/route.ts           # POST: Cancels subscription immediately
│       │   └── portal/route.ts           # POST: Redirects to Stripe customer portal
│       ├── webhooks/
│       │   └── stripe/route.ts           # POST: Stripe webhook. Events: subscription.updated/deleted → updates profiles.subscription_tier
│       ├── analytics/
│       │   └── events/route.ts           # GET: Fetches last 50 PostHog events for auth'd user. Returns configured:false if env vars missing
│       ├── admin/
│       │   ├── invite/route.ts           # POST: Admin invites user by email → inserts into admin_invites (type='invite', status='pending')
│       │   ├── invites/
│       │   │   ├── route.ts              # GET: Lists all admin invites/requests. Joins with profiles for display names
│       │   │   └── [id]/route.ts         # PUT: Admin approves/rejects invites. Updates status + sets role in profiles
│       ├── studio/
│       │   └── request-access/route.ts   # POST: Non-admin requests CMS access → inserts admin_invites (type='request')
│       └── delete-account/route.ts       # POST: Deletes user from Supabase auth + cascades to posts

├── features/
│   ├── admin/
│   │   ├── AdminInvitePanel.tsx          # Form: invite users by email. Calls /api/admin/invite
│   │   └── AdminUsersTable.tsx           # Table of all profiles. Columns: email, role, subscription, joined. Allows role updates
│   ├── auth/
│   │   ├── AuthShell.tsx                 # Layout wrapper centering the auth form on desktop
│   │   ├── LoginForm.tsx                 # Email/password login + Google OAuth. react-hook-form. Calls Supabase auth
│   │   └── SignupForm.tsx                # Email/password signup. Terms checkbox. Auto-creates profile
│   ├── analytics/
│   │   └── PostHogEventsClient.tsx       # Client component polling /api/analytics/events. Shows events list + metrics (live users, avg session)
│   ├── billing/
│   │   ├── BillingPageClient.tsx         # Master page: orchestrates CurrentPlanCard, PlansGrid, UsageCard. Fetches Stripe prices
│   │   ├── PlansGrid.tsx                 # Free vs pro plan cards. Upgrade/downgrade buttons. Fetches pricing from API or CMS fallback
│   │   ├── CurrentPlanCard.tsx           # Shows current subscription (free/pro/cancelling). Manage/Cancel/Reactivate buttons
│   │   ├── UsageCard.tsx                 # Usage meters: posts published, API calls, storage, team seats
│   │   └── CancelSubscriptionDialog.tsx  # Confirmation before subscription cancellation
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx           # Main layout for auth'd pages. Renders Sidebar, MobileTopBar, MobileBottomNav. Uses useUIStore
│   │   ├── Sidebar.tsx                   # Left nav. Links: Posts, Analytics, Settings, Billing, Admin (admin-only). Collapsible
│   │   ├── SidebarNav.tsx                # Navigation items list. Highlights active route
│   │   ├── SidebarFooter.tsx             # User avatar + name + sign-out at sidebar bottom
│   │   ├── SidebarLogo.tsx               # Logo/branding at sidebar top
│   │   ├── MobileTopBar.tsx              # Mobile top bar: logo + menu toggle + user avatar
│   │   ├── MobileBottomNav.tsx           # Mobile bottom tab nav: Posts, Analytics, Settings, Billing, Admin
│   │   ├── DashboardHeader.tsx           # Page title + breadcrumbs
│   │   ├── DashboardStats.tsx            # Stats cards: total posts, published, drafts
│   │   ├── EnvLogsTable.tsx              # Environment logs display (not actively used)
│   │   ├── CollapsedSignOut.tsx          # Sign out button for collapsed sidebar state
│   │   ├── ColorArchitectureCard.tsx     # Design system showcase (demo only)
│   │   ├── EditorialTypographyCard.tsx   # Design system showcase (demo only)
│   │   ├── GraphQLNodeCard.tsx           # Design system showcase (demo only)
│   │   └── InteractionLibraryCard.tsx    # Design system showcase (demo only)
│   ├── posts/
│   │   ├── PostsPageClient.tsx           # Main posts management page (client). Search (debounced), create/edit/delete modals
│   │   ├── PostsTable.tsx                # Posts table. Columns: title, status, image, tags, last modified. Row actions: view, edit, delete
│   │   ├── PostsHeader.tsx               # Page title + description
│   │   ├── PostsStatsBar.tsx             # Stats: my posts count, published, drafts
│   │   ├── PostsEmptyState.tsx           # Fallback UI when no posts. CTA to create first post
│   │   ├── PostsTableSkeleton.tsx        # Loading skeleton for posts table
│   │   ├── CreatePostModal.tsx           # Form: create post (title, excerpt, image, language, tags, featured). Calls /api/posts
│   │   ├── EditPostModal.tsx             # Form: edit existing post
│   │   ├── DeletePostDialog.tsx          # Confirmation before post deletion
│   │   ├── PostDetail.tsx                # Post detail renderer. Props: post data, nav (prev/next slugs), section configs
│   │   ├── FeaturedBanner.tsx            # Banner highlighting featured posts
│   │   └── LivePreviewClient.tsx         # Optional live preview mode integration
│   └── settings/
│       ├── ProfileForm.tsx               # Profile editor: display name, bio, website, email. Calls /api/users/{id}
│       ├── ProfileAvatar.tsx             # Avatar uploader → Supabase storage → profiles.avatar_url
│       └── DeleteAccountDialog.tsx       # Confirmation + final warning. Calls /api/delete-account

├── sections/                             # CMS Section Renderers — sectionType discriminator → React component
│   ├── SectionRenderer.tsx               # Main dispatcher: sectionType → component
│   ├── _groupedExports.ts                # Barrel export for all sections
│   │
│   │   # PUBLIC / MARKETING SECTIONS
│   ├── HeroSection.tsx                   # Banner: heading, subheading, badge, CTAs. Layouts: centered or split
│   ├── CtaSection.tsx                    # CTA block: primary/secondary buttons. Themes: dark, indigo, subtle
│   ├── FeaturedPostsSection.tsx          # N featured posts in grid/list/featured layout. Fetches from Directus
│   ├── RecentPostsSection.tsx            # Latest posts feed. Limit configurable
│   ├── RichTextSection.tsx               # Rich text content renderer
│   ├── StatsSection.tsx                  # Stats cards. Optional live post count
│   ├── FormSection.tsx                   # Generic form builder. Fields from CMS config. Actions: POST/GET
│   ├── GridSection.tsx                   # Grid of items (2/3/4 columns). Each: heading, body, icon, image, link
│   ├── ImageSection.tsx                  # Single image + caption. Max width: narrow/medium/wide/full
│   ├── GallerySection.tsx                # Image gallery. Layouts: masonry/grid/carousel. Lightbox toggle
│   ├── VideoSection.tsx                  # Embedded video. Poster image. Max width configurable
│   ├── TabsSection.tsx                   # Tabbed interface. Each tab: label, icon, content, image
│   ├── CarouselSection.tsx               # Image carousel. Autoplay, dots, arrows toggleable
│   ├── TableSection.tsx                  # Striped/bordered table from CMS data
│   ├── TimelineTeamLogoBar.tsx           # Timeline events, team members, logo bar components
│   ├── LogoBarSection.tsx                # Scrolling logo bar (e.g., "Trusted by…")
│   ├── TeamSection.tsx                   # Team member cards with bios, social links
│   ├── PricingSection.tsx                # Pricing plans grid. Highlighted plan. Feature lists per plan
│   ├── NewsletterSection.tsx             # Newsletter signup form
│   ├── BannerSection.tsx                 # Dismissible banner alert (info/warning/error colors)
│   ├── TestimonialsSection.tsx           # Testimonials carousel/grid/single with ratings
│   ├── FaqSection.tsx                    # FAQ accordion. Layouts: accordion/open/two-col
│   ├── newSections.tsx                   # Exports: HeadingSection, FeatureListSection, ColumnsSection, SpacerSection, DividerSection, NotFoundSection
│   │
│   │   # AUTH SECTIONS
│   ├── AuthHeroSection.tsx               # Left-side hero for auth pages. Features list, graphics
│   ├── LoginSection.tsx                  # Legacy login page layout using <LoginForm>
│   ├── SignupSection.tsx                 # Legacy signup page layout using <SignupForm>
│   ├── AuthFormSection.tsx               # Unified auth section. Mode: login/signup. OAuth + email/password toggleable
│   │
│   │   # POST DETAIL SECTIONS (config-only sub-sections)
│   ├── PostDetailPageSection.tsx         # Wrapper orchestrating post detail layout
│   ├── PostDetailHeaderSection.tsx       # Config: Featured/Language badge labels
│   ├── PostDetailMetaSection.tsx         # Config: Author/Date/Unpublished labels
│   ├── PostDetailBodySection.tsx         # Config: Share/Link copied labels
│   ├── PostDetailTagsSection.tsx         # Config: Tag labels
│   ├── PostDetailBackLinkSection.tsx     # Config: Back link label, href, pagination labels
│   │
│   │   # POSTS MANAGEMENT SECTIONS (/posts page)
│   ├── PostsPageSection.tsx              # Master container for /posts page
│   ├── PostsHeaderSection.tsx            # Page title + subheading + API badge
│   ├── PostsStatsSection.tsx             # Stats bar: my posts, published, drafts
│   ├── PostsActionsSection.tsx           # Action buttons: Sync, New Post
│   ├── PostsSearchSection.tsx            # Search bar. Integrates with useUIStore.postsSearchQuery
│   ├── PostsTableSection.tsx             # Post table wrapper. Config from CMS
│   │
│   │   # BILLING SECTIONS (/billing page)
│   ├── BillingSection.tsx                # Legacy master billing container
│   ├── BillingHeaderSection.tsx          # Config: page heading + subheading
│   ├── BillingCurrentPlanSection.tsx     # Config: current subscription status UI
│   ├── BillingUsageSection.tsx           # Config: usage display (posts, API, storage, seats)
│   ├── BillingPlansGridSection.tsx       # Config: plans grid display
│   ├── BillingFooterSection.tsx          # Config: footer copy (Stripe/webhook notes)
│   │
│   │   # SETTINGS SECTIONS (/settings page)
│   ├── SettingsSection.tsx               # Legacy master settings container
│   ├── SettingsHeaderSection.tsx         # Config: page heading
│   ├── SettingsInfoSection.tsx           # Config: upload photo label
│   ├── SettingsFormSection.tsx           # Config: form field labels (display name, email, bio, website, buttons)
│   ├── SettingsDangerSection.tsx         # Config: delete account section labels
│   │
│   │   # ANALYTICS / ADMIN SECTIONS
│   ├── AnalyticsSection.tsx              # Master analytics renderer. Fetches PostHog data, displays events + metrics
│   └── AdminSection.tsx                  # Master admin page. Displays users table + invite panel

├── components/
│   ├── ui/                               # shadcn/ui — Radix UI primitives + Tailwind styling
│   │   ├── button.tsx                    # Variants: primary, secondary, ghost, destructive
│   │   ├── input.tsx, textarea.tsx, label.tsx, form.tsx
│   │   ├── dialog.tsx, alert-dialog.tsx, dropdown-menu.tsx, sheet.tsx
│   │   ├── avatar.tsx, badge.tsx, separator.tsx, skeleton.tsx
│   │   ├── table.tsx, sonner.tsx
│   ├── custom/                           # CMS component document renderers
│   │   ├── ComponentRenderer.tsx         # Dispatches componentType → layout/ or content/ sub-renderer
│   │   ├── layout/
│   │   │   ├── NavbarComponent.tsx       # Navbar from component doc. Links, CTA, auth toggle
│   │   │   ├── FooterComponent.tsx       # Footer from component doc. Columns, social links
│   │   │   ├── SidebarComponent.tsx      # App sidebar from component doc. Nav items, collapsible
│   │   │   ├── MobileNavTopComponent.tsx
│   │   │   └── MobileNavBottomComponent.tsx
│   │   └── content/
│   │       ├── GridComponent.tsx         # Grid of items. Columns (2/3/4), card styles
│   │       ├── CardsComponent.tsx        # Card grid. Layouts: grid-2/grid-3/featured/horizontal
│   │       ├── FormComponent.tsx         # Form builder. Fields, validation, submission
│   │       ├── DataTableComponent.tsx    # Tabular data. Columns, sorting, pagination
│   │       ├── PricingTableComponent.tsx # Pricing plans with billing toggle
│   │       ├── ListComponent.tsx         # List: bullet/numbered/checklist/icon/plain. Columns
│   │       └── FlexComponent.tsx         # Flex layout wrapper. Direction, wrap, gap, align, justify
│   ├── Navbar.tsx                        # Public pages navbar. Links from siteConfig. Language switcher. Auth indicator
│   ├── Footer.tsx                        # Public pages footer. Links, social icons. Dark theme
│   ├── LanguageSwitcher.tsx              # Language dropdown (EN/HI/KN). Sets ?lang= or route
│   ├── PostsListing.tsx                  # Public post list. Card layout with images
│   ├── PostFilterGrid.tsx                # Post filtering + grid. Tag filters, sorting
│   ├── providers.tsx                     # Root providers: QueryClientProvider, PostHogProvider, AuthProvider
│   └── posthog-provider.tsx              # PostHog client setup

├── lib/
│   ├── directus/
│   │   ├── client.ts                     # directusClient (public read), directusAdminClient (write, admin token)
│   │   ├── queries.ts                    # All CMS read functions: getPostBySlugAndLang, getPageBySlugAndLang,
│   │   │                                 #   getFeaturedPosts, getMyPosts, getSiteConfig, getAllPostSlugs + more
│   │   └── pageResolver.ts               # resolveContent(slug, lang) → discriminated union (page|post)
│   │                                     #   Constants: SUPPORTED_LANGUAGES ['en','hi','kn'], LANG_LABELS, isSupportedLang()
│   ├── supabase/
│   │   ├── client.ts                     # Browser-safe client. Cookie-based session. For client components
│   │   ├── server.ts                     # Server-only client. Server cookies. For route handlers + server components
│   │   └── middleware.ts                 # updateSession(). Route config:
│   │                                     #   Public: /api/*, /login, /signup, /auth/*
│   │                                     #   Protected: /posts, /analytics, /settings, /billing, /admin
│   │                                     #   Admin-only: /admin, /analytics
│   ├── utils.ts                          # cn() — clsx + tailwind-merge
│   ├── seo.ts                            # buildCanonicalPath(), buildCanonicalUrl(), buildHreflangPaths(), buildMetadata()
│   ├── stripe.ts                         # Stripe server instance. Returns null if STRIPE_SECRET_KEY not set
│   ├── email.ts                          # Email delivery via Resend. Called from welcome flows
│   └── navigation.ts                     # localizeHref(), getLocalizedLabel()

├── hooks/
│   ├── useUser.ts                        # Wrapper over AuthContext → { user, profile, isLoading }
│   └── useDebounce.ts                    # Debounce hook. Used in posts search

├── stores/
│   └── uiStore.ts                        # Zustand store. sidebarOpen, postsSearchQuery
│                                         #   toggleSidebar(), setSidebarOpen(), setPostsSearchQuery()

├── types/
│   ├── cms.ts                            # All CMS TypeScript types. Add new section/component types here
│   │                                     #   PostRecord, PostCard, PageRecord, CmsSection, ComponentDoc,
│   │                                     #   SiteConfig, all section sub-types, all component sub-types
│   ├── directus.ts                       # Directus row types (DirectusPostRow, DirectusPageRow, DirectusSiteConfigRow)
│   │                                     #   Normalised shapes + toPost()/toPage()/toSiteConfig() converters
│   │                                     #   DirectusSchema for type-safe SDK client
│   ├── supabase.ts                       # Auto-generated DB types. DO NOT EDIT MANUALLY
│   │                                     #   profiles table, user_role_enum (member|admin), subscription_tier_enum (free|pro)
│   └── admin.ts                          # AdminInviteType, AdminInviteStatus, AdminInvite, AdminInviteRow, AdminDatabase

├── scripts/
│   ├── directus-bootstrap.ts             # Creates Directus collections + fields
│   └── directus-seed.ts                  # Seeds initial pages, posts, site config data

├── proxy.ts                              # Next.js middleware. ALWAYS_PUBLIC, ALWAYS_AUTH, ALWAYS_ADMIN path checks
├── next.config.ts                        # Remote image patterns: supabase CDN, picsum.photos, unsplash
├── tailwind.config.ts                    # Tailwind v4 config
├── tsconfig.json                         # ES2017, ESNext, strict mode, @/* → root
└── package.json
```

---

## Architecture & Data Flows

### 1. Page Rendering Pipeline
```
Request → proxy.ts (auth check)
       → app/[lang]/page.tsx
       → lib/directus/pageResolver.ts (resolveContent(slug, lang))
       → Directus REST fetch (lib/directus/queries.ts)
       → SectionRenderer.tsx (maps sectionType → React component)
       → Section component renders (may fetch more data or use CMS config)
```

### 2. Auth Flow
```
LoginForm / SignupForm → Supabase auth
       → app/auth/callback/route.ts (OAuth/email OTP)
       → proxy.ts → lib/supabase/middleware.ts updateSession() (every request)
       → AuthProvider (components/providers.tsx) — single Supabase subscription
       → useUser() hook → { user, profile, isLoading } (consumed everywhere)
```

### 3. Posts Management Flow
```
PostsPageClient.tsx
    → GET /api/posts → Directus items/posts filtered by author_id
    → CreatePostModal → POST /api/posts (create post via directusAdminClient, check subscription limit)
    → EditPostModal → PATCH /api/posts/[id]
    → DeletePostDialog → DELETE /api/posts/[id]
    → PostsTable renders via @tanstack/react-table
    → useUIStore.postsSearchQuery shared between PostsSearchSection (input) and PostsTable (filter)
```

### 4. Billing Flow
```
BillingPageClient.tsx
    → GET /api/stripe/prices → Stripe active prices
    → Upgrade: POST /api/create-checkout-session → Stripe hosted checkout
    → Manage: POST /api/stripe/portal → Stripe customer portal
    → Cancel: POST /api/stripe/cancel → immediate cancellation
    → Stripe webhook → POST /api/webhooks/stripe → updates profiles.subscription_tier in Supabase
```

### 5. Admin Access Flow
```
/api/studio/request-access → admin_invites (type='request', status='pending')
    → Admin approves via GET /api/admin/invites → PUT /api/admin/invites/[id] → sets profile.role='admin'
    → Admin panel at /admin — uses Directus admin UI at :8055 for CMS management
```

---

## Key Architectural Patterns

### Section Renderer Pattern
- Page sections are stored as a **JSON blob** in `pages.sections` in Directus
- Discriminator: `sectionType` field on each section object
- Each section type has one named sub-object (e.g., `hero`, `featuredPosts`, `authForm`)
- `SectionRenderer.tsx` maps `sectionType` → React component

### Component Document Pattern
- Reusable UI blocks (navbar, footer, sidebar, grid, cards, etc.) stored as JSON in `site_config`
- Discriminator: `componentType`
- `ComponentRenderer.tsx` dispatches to `components/custom/layout/` or `components/custom/content/`

### Access Control (Layered)
| Layer | Mechanism |
|-------|-----------|
| Middleware | `proxy.ts` — ALWAYS_PUBLIC, ALWAYS_AUTH, ALWAYS_ADMIN path matching |
| Page | `page.access` field in Directus (guest/user/admin) |
| API | Supabase auth check + role validation in every route handler |
| UI | `useUser()` hook for client-side conditional rendering |

### Multi-Language Support
- **Languages**: `en` (default, no prefix), `hi`, `kn` → `/hi/slug`, `/kn/slug`
- **Uniqueness**: (slug, language) pair — same slug allowed across languages
- **Directus**: `language` field on every `posts` and `pages` record
- **Resolver**: `lib/directus/pageResolver.ts` — `SUPPORTED_LANGUAGES`, `isSupportedLang()`
- **Nav helpers**: `lib/navigation.ts` — `localizeHref()`, `getLocalizedLabel()`

### Global State (Zustand — `stores/uiStore.ts`)
- `sidebarOpen` — sidebar visibility, toggled by `DashboardLayout` + `MobileTopBar`
- `postsSearchQuery` — bridge between `PostsSearchSection` (input writes) and `PostsTable` (filter reads)

### Auth Context at Root
- Single Supabase subscription in `AuthProvider` (components/providers.tsx)
- No per-component re-fetches → no nav flicker on navigation
- `useUser()` hook used in 16+ callsites

---

## Adding a New Content Section (Step-by-Step)

1. Renderer → `sections/MySection.tsx`
2. Add case in `sections/SectionRenderer.tsx`
3. Add TypeScript type in `types/cms.ts`
4. Add the section JSON to relevant pages in Directus admin (`http://localhost:8055`)

---

## Directus CMS

- **Admin UI**: `http://localhost:8055` (separate process, not embedded)
- **SDK**: `@directus/sdk` v21 — `readItems`, `createItem`, `updateItem`, `deleteItem`, `aggregate`
- **Bootstrap**: `npm run directus:bootstrap` — creates collections + fields
- **Seed**: `npm run directus:seed` — seeds pages, posts, site config

### Collections

| Collection | Description |
|------------|-------------|
| `posts` | Blog posts — title, slug, language, excerpt, body (JSON), cover_image, published_at, featured, tags, author_* |
| `pages` | Page builder — title, slug, language, access, layout, sections (JSON blob), seo_* |
| `site_config` | Singleton — navbar_config, footer_config, sidebar_config, mobile_nav_config (all JSON) |

### CMS Data Fetch (Server Components)

```ts
import { getPageBySlugAndLang, getSiteConfig } from '@/lib/directus/queries'

const page = await getPageBySlugAndLang('home', 'en')
const config = await getSiteConfig()
```

---

## Authentication (Supabase)

| Client | File | Use |
|--------|------|-----|
| Browser | `lib/supabase/client.ts` | Client components |
| Server | `lib/supabase/server.ts` | Route handlers + server components |
| Middleware | `lib/supabase/middleware.ts` | `updateSession()` called in proxy.ts |

### User Roles
- `member` — default, access to posts/settings/billing
- `admin` — additionally access analytics, admin panel

### Subscription Tiers
- `free` — limited to 5 posts
- `pro` — unlimited posts

### Profiles Table Fields
`id, email, display_name, bio, website, avatar_url, role, subscription_tier, stripe_customer_id, subscription_id, created_at, updated_at, feature_flags, preferences, last_seen_at, posthog_distinct_id`

---

## Stripe Billing

- **Test mode only** — test card: `4242 4242 4242 4242`
- `lib/stripe.ts` returns null if `STRIPE_SECRET_KEY` not set (graceful degradation)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-checkout-session` | POST | Start Stripe checkout |
| `/api/stripe/portal` | POST | Open billing portal |
| `/api/stripe/cancel` | POST | Cancel subscription |
| `/api/stripe/prices` | GET | Fetch active prices |
| `/api/webhooks/stripe` | POST | Handle subscription events → update profiles |

---

## PostHog Analytics

- **Client-side**: `components/providers.tsx` (PostHogProvider) + `components/posthog-provider.tsx`
- **Server-side**: `posthog-node` in API routes
- **Bridge endpoint**: `GET /api/analytics/events` — fetches last 50 events for auth'd user
- **Events tracked**: login, signup, post_viewed, post_created, upgrade_intent, etc.
- **Feature flags**: e.g., `show-featured-banner` per user (checked in `FeaturedBanner.tsx`)

---

## All API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/posts` | GET | user | List authenticated user's posts |
| `/api/posts` | POST | user | Create post. Checks subscription limit (free=5) |
| `/api/posts/[id]` | PATCH, DELETE | user | Update or delete a post |
| `/api/create-checkout-session` | POST | user | Start Stripe checkout |
| `/api/stripe/prices` | GET | — | Fetch active Stripe prices |
| `/api/stripe/portal` | POST | user | Open billing portal |
| `/api/stripe/cancel` | POST | user | Cancel subscription |
| `/api/webhooks/stripe` | POST | — | Stripe webhook handler |
| `/api/analytics/events` | GET | user | Fetch PostHog events |
| `/api/admin/invite` | POST | admin | Invite user by email |
| `/api/admin/invites` | GET | admin | List all invites/requests |
| `/api/admin/invites/[id]` | PUT | admin | Approve/reject invite |
| `/api/studio/request-access` | POST | user | Request CMS access |
| `/api/delete-account` | POST | user | Delete user account |
| `/auth/callback` | GET | — | Supabase OAuth/email callback |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Directus
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_ADMIN_TOKEN=               # Full-access static token
NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN=  # Read-only token (safe for browser)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PERSONAL_API_KEY=
POSTHOG_PROJECT_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Dev Commands

```bash
npm run dev                  # Start Next.js dev server (port 3000)
npm run build                # Production build
npm run lint                 # ESLint
npm run directus:bootstrap   # Create Directus collections + fields
npm run directus:seed        # Seed initial pages, posts, site config
```

---

## UI Conventions

| Tool | Library |
|------|---------|
| Component library | shadcn/ui (`components/ui/`) |
| Icons | Lucide React |
| Toasts | Sonner |
| Tables | TanStack React Table (`@tanstack/react-table`) |
| Forms | React Hook Form + Zod |
| Global state | Zustand (`stores/uiStore.ts`) |
| Data fetching (client) | React Query (`@tanstack/react-query`) |
| Styling | Tailwind CSS v4 (utility classes, no inline styles) |
| Themes | next-themes |

---

## TypeScript Conventions

- Path alias `@/` → project root
- CMS types → `types/cms.ts` (sections, pages, site config) — add new block types here
- Directus row types → `types/directus.ts`
- Supabase types → `types/supabase.ts` — auto-generated, **do not edit manually**
- Admin types → `types/admin.ts`
- `cn()` from `lib/utils.ts` for conditional classnames
- Client components: `'use client'` at top of file
- Server components: async functions, no `'use client'`
- API routes: always validate auth, use try-catch, return `NextResponse.json`

---

## Common Patterns

### Server Component Data Fetch
```ts
import { getPageBySlugAndLang, getSiteConfig } from '@/lib/directus/queries'

const page = await getPageBySlugAndLang('home', 'en')
const config = await getSiteConfig()
```

### Auth Check in Server Component
```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Client Component Auth State
```ts
import { useUser } from '@/hooks/useUser'

const { user, profile, isLoading } = useUser()
```

### Conditional Classnames
```ts
import { cn } from '@/lib/utils'

className={cn('base-class', condition && 'conditional-class')}
```
