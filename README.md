# ContentFlow

A CMS-driven SaaS dashboard built with Next.js 16, Directus, Supabase Auth, Stripe billing, and PostHog analytics. Combines a public multilingual marketing/blog site with a protected user dashboard — all content managed through Directus.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19.2.4, Tailwind CSS v4 |
| Components | shadcn/ui, Radix UI, Lucide React |
| CMS | Directus (@directus/sdk 21.2.2) |
| Auth | Supabase Auth + SSR (@supabase/ssr 0.9.0) |
| Database | Supabase (PostgreSQL) |
| Billing | Stripe 20.4.1 (test mode) |
| Analytics | PostHog (posthog-js + posthog-node) |
| Email | Resend 6.11.0 |
| Forms | React Hook Form 7 + Zod 4 |
| Tables | TanStack React Table 8 |
| State | Zustand 5, TanStack React Query 5 |
| Toasts | Sonner 2 |
| Language | TypeScript (strict) |

---

## Project Structure

```
contentflow/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # English homepage (/)
│   ├── layout.tsx                    # Root layout — Providers, Toaster
│   ├── globals.css
│   ├── [lang]/
│   │   ├── page.tsx                  # /hi, /kn homepages + all English slug pages
│   │   └── [slug]/page.tsx           # Hindi/Kannada pages + posts
│   ├── auth/callback/route.ts        # Supabase OAuth callback
│   └── api/                          # All API routes (see below)
│
├── features/                         # Feature modules
│   ├── admin/components/             # AdminUsersTable, AdminInvitePanel
│   ├── analytics/components/         # PostHogEventsClient
│   ├── auth/components/              # AuthShell, LoginForm, SignupForm
│   ├── billing/components/           # BillingPageClient, PlansGrid, CurrentPlanCard,
│   │                                 #   UsageCard, CancelSubscriptionDialog
│   ├── dashboard/components/         # DashboardLayout, DashboardHeader, DashboardStats
│   │                                 #   Sidebar, SidebarNav, SidebarLogo, SidebarFooter
│   │                                 #   MobileTopBar, MobileBottomNav, CollapsedSignOut
│   ├── posts/components/             # PostsPageClient, PostDetail, PostsTable,
│   │                                 #   PostsHeader, PostsStatsBar, PostsTableSkeleton
│   │                                 #   CreatePostModal, EditPostModal, DeletePostDialog
│   │                                 #   FeaturedBanner, PostsEmptyState, LivePreviewClient
│   └── settings/components/          # ProfileForm, ProfileAvatar, DeleteAccountDialog
│
├── sections/                         # CMS section renderers (45+)
│   ├── SectionRenderer.tsx           # Maps sectionType → component
│   ├── HeroSection.tsx               # ...and all other section files
│   └── _groupedExports.ts
│
├── components/
│   ├── ui/                           # shadcn/ui: Button, Input, Dialog, Table, Badge,
│   │                                 #   Avatar, Sheet, AlertDialog, Form, Textarea,
│   │                                 #   DropdownMenu, Skeleton, Separator, Sonner
│   ├── custom/                       # CMS component doc renderers (navbar, footer, etc.)
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── LanguageSwitcher.tsx
│   ├── PostFilterGrid.tsx
│   ├── PostsListing.tsx
│   └── providers.tsx                 # Auth, React Query, PostHog, Theme providers
│
├── lib/
│   ├── directus/
│   │   ├── client.ts                 # directusClient (public) + directusAdminClient (write)
│   │   ├── queries.ts                # All CMS read functions (posts, pages, site config)
│   │   └── pageResolver.ts           # resolveContent() + SUPPORTED_LANGUAGES, isSupportedLang()
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client (async cookies)
│   │   └── middleware.ts             # updateSession() for session refresh
│   ├── email.ts                      # Resend invite email + dark HTML template
│   ├── navigation.ts                 # localizeHref(), nav role + icon helpers
│   ├── stripe.ts                     # Stripe instance
│   ├── seo.ts                        # buildMetadata() helper
│   └── utils.ts                      # cn() (clsx + tailwind-merge)
│
├── hooks/
│   ├── useUser.ts                    # Auth state + profile (user, profile, loading)
│   └── useDebounce.ts
│
├── stores/
│   └── uiStore.ts                    # Zustand: sidebar open/close, postsSearchQuery
│
├── types/
│   ├── cms.ts                        # All CMS TypeScript types (sections, pages, posts, site config)
│   ├── directus.ts                   # Directus row types + normalised shapes + DirectusSchema
│   ├── supabase.ts                   # Auto-generated Supabase DB types (do not edit)
│   └── admin.ts                      # AdminInvite types + AdminDatabase type
│
├── scripts/
│   ├── directus-bootstrap.ts         # Creates Directus collections + fields
│   └── directus-seed.ts              # Seeds initial page/post/site-config data
│
├── proxy.ts                          # Next.js middleware (session + route protection)
├── next.config.ts                    # Next.js config + image domains
└── tsconfig.json
```

---

## Routes

### Public Routes

| Route | Description |
|---|---|
| `/` | English homepage (CMS page builder) |
| `/[lang]` | Language homepage — `/hi`, `/kn` |
| `/[lang]/[slug]` | Any CMS-driven page or post (all languages) |

### Protected Routes (require auth)

Middleware enforces login for: `/posts` · `/settings` · `/billing` · `/analytics` · `/admin`

### Admin-Only Routes

`/admin` · `/analytics` — additionally require `profiles.role === 'admin'`

---

## API Routes

| Endpoint | Method(s) | Auth | Description |
|---|---|---|---|
| `/api/posts` | GET | user | List authenticated user's posts |
| `/api/posts` | POST | user | Create a new post (checks subscription limit) |
| `/api/posts/[id]` | PATCH, DELETE | user | Update or delete a post |
| `/api/admin/invite` | POST | admin | Invite or directly promote a user |
| `/api/admin/invites` | GET | admin | List all pending invites + access requests |
| `/api/admin/invites/[id]` | PATCH | admin | Approve / reject / cancel an invite |
| `/api/analytics/events` | GET | user | Fetch PostHog analytics events |
| `/api/create-checkout-session` | POST | user | Start Stripe Checkout for Pro upgrade |
| `/api/delete-account` | DELETE | user | Delete user account + associated data |
| `/api/stripe/cancel` | POST | user | Cancel Stripe subscription |
| `/api/stripe/portal` | POST | user | Open Stripe billing portal |
| `/api/stripe/prices` | GET | — | Fetch available Stripe prices |
| `/api/studio/request-access` | POST | user | Request admin panel access |
| `/api/webhooks/stripe` | POST | — | Stripe webhook handler |
| `/auth/callback` | GET | — | Supabase OAuth callback |

---

## Authentication

- Browser client: `lib/supabase/client.ts`
- Server client: `lib/supabase/server.ts` (async cookies, App Router compatible)
- Middleware: `proxy.ts` → `updateSession()` in `lib/supabase/middleware.ts`
- Auth hook: `hooks/useUser.ts` — returns `{ user, profile, loading }`

### Roles (`profiles.role`)

| Role | Access |
|---|---|
| `member` | Posts, Settings, Billing |
| `admin` | All above + Analytics, Admin panel |

### Subscription Tiers (`profiles.subscription_tier`)

| Tier | Limit |
|---|---|
| `free` | 5 published posts |
| `pro` | Unlimited posts |

---

## Directus CMS

- **Admin UI**: `http://localhost:8055` (separate process, not embedded)
- **SDK**: `@directus/sdk` v21 — `readItems`, `createItem`, `updateItem`, `deleteItem`, `aggregate`

### Collections

| Collection | Description |
|---|---|
| `posts` | Blog posts — title, slug, language, excerpt, body (JSON), cover_image, published_at, featured, tags, author_* |
| `pages` | Page builder — title, slug, language, access, layout, sections (JSON blob), seo_* |
| `site_config` | Singleton — navbar_config, footer_config, sidebar_config, mobile_nav_config (all JSON) |

### Page Builder Sections (45+)

Sections are stored as a **JSON array** in `pages.sections`. Each item has a `sectionType` discriminator. `SectionRenderer.tsx` maps this to the right React component.

**Marketing:** HeroSection, CtaSection, FeaturedPostsSection, RecentPostsSection, StatsSection, GridSection, GallerySection, CarouselSection, VideoSection, TabsSection, ImageSection, TableSection, RichTextSection, TimelineSection, TeamSection, LogoBarSection, PricingSection, TestimonialsSection, FaqSection, NewsletterSection, BannerSection, FormSection

**App Pages:** LoginSection, SignupSection, AuthFormSection, AuthHeroSection, PostsPageSection, PostDetailPageSection, BillingSection, SettingsSection, AnalyticsSection, AdminSection (+ sub-sections for each)

### Adding a New Section

1. Create renderer → `sections/MySection.tsx`
2. Add case in `sections/SectionRenderer.tsx`
3. Add TypeScript type in `types/cms.ts`
4. Add the section JSON to relevant pages in Directus admin

### CMS Data Fetch (Server Components)

```ts
import { getPageBySlugAndLang, getSiteConfig } from '@/lib/directus/queries'

const page = await getPageBySlugAndLang('home', 'en')
const config = await getSiteConfig()
```

---

## Internationalization

| Language | Code | URL prefix |
|---|---|---|
| English | `en` | `/` (no prefix) |
| Hindi | `hi` | `/hi/` |
| Kannada | `kn` | `/kn/` |

- Every CMS document has a `language` field
- All queries in `lib/directus/queries.ts` filter by `language`
- `lib/directus/pageResolver.ts` exports `SUPPORTED_LANGUAGES`, `isSupportedLang()`
- Nav localization via `lib/navigation.ts` — `localizeHref()`, `getLocalizedLabel()`

---

## Stripe Billing

- Test mode only — use card `4242 4242 4242 4242`
- Checkout: `POST /api/create-checkout-session`
- Portal: `POST /api/stripe/portal`
- Cancel: `POST /api/stripe/cancel`
- Webhook: `POST /api/webhooks/stripe` — updates `profiles.subscription_tier`

---

## PostHog Analytics

- Client-side: `components/providers.tsx` (PostHogProvider) + `components/posthog-provider.tsx`
- Server-side: `posthog-node` in API routes
- Events tracked: `login`, `signup`, `post_viewed`, `post_created`, `upgrade_intent`, etc.
- Feature flags: e.g., `show-featured-banner` per user
- Admin analytics view: `features/analytics/PostHogEventsClient.tsx`

---

## Database

### `profiles` table

Key fields: `id`, `email`, `display_name`, `role` (member/admin), `subscription_tier` (free/pro), `avatar_url`, `stripe_customer_id`

> Auto-generated types in `types/supabase.ts` — do not edit manually.

### `admin_invites` table

Defined in `supabase/migrations/001_admin_invites.sql`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | TEXT | Target email |
| `user_id` | UUID | FK → auth.users (nullable until sign-up) |
| `type` | TEXT | `invite` or `request` |
| `status` | TEXT | `pending`, `approved`, `rejected`, `cancelled` |
| `invited_by` | UUID | Admin who sent the invite |
| `reviewed_by` | UUID | Admin who approved/rejected |

RLS enabled — users can view their own rows. All writes use the service-role client (bypasses RLS).

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
RESEND_FROM_EMAIL=                  # Optional — defaults to onboarding@resend.dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Dev Commands

```bash
npm run dev                  # Start dev server on port 3000
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # ESLint
npm run directus:bootstrap   # Create Directus collections + fields
npm run directus:seed        # Seed initial pages, posts, site config
```

---

## Conventions

### TypeScript

- Path alias `@/` → project root
- CMS types → `types/cms.ts` (sections, pages, site config)
- Directus row types → `types/directus.ts`
- Supabase types → `types/supabase.ts` (auto-generated, never edit manually)
- Admin workflow types → `types/admin.ts`
- `cn()` utility from `lib/utils.ts` for conditional classnames (clsx + tailwind-merge)

### Auth in Server Components

```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Allowed Remote Image Domains

- `qyzgcwwoehpeietxrqrh.supabase.co`
- `picsum.photos`
- `fastly.picsum.photos`
- `images.unsplash.com`
