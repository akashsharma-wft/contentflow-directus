// sections/SectionRenderer.tsx
//
// Registry pattern: maps CMS section types → React components.
// This is an ASYNC SERVER COMPONENT — all section components can be async too.
//
// Architecture:
//   All sections come from dereferenced `section` documents (sections[]->).
//   Each document has a `sectionType` discriminator and a named content
//   sub-object (hero, featuredPosts, authForm, …). SectionRenderer reads
//   sectionType, extracts the sub-object, and passes it to the component.
//
// HOW TO ADD A NEW SECTION:
//   1. Create component: sections/MySection.tsx\n//   2. Add case below under the \section\ _type block\n//   3. Add TypeScript type to types/cms.ts
//
// NOTE:
//   navbarSection and footerSection are structural — controlled by page
//   layout in app/page.tsx, NOT rendered here.

import type { CmsSection } from '@/types/cms'
import { ComponentRenderer }  from '@/components/custom/ComponentRenderer'

// ── Public sections ────────────────────────────────────────────────────────────
import { HeroSection }           from './HeroSection'
import { CtaSection }            from './CtaSection'
import { FeaturedPostsSection }  from './FeaturedPostsSection'
import { RecentPostsSection }    from './RecentPostsSection'
import { RichTextSection }       from './RichTextSection'
import { StatsSection }          from './StatsSection'
import { FormSection }           from './FormSection'
import { GridSection }           from './GridSection'
import { ImageSection }          from './ImageSection'
import { GallerySection }        from './GallerySection'
import { VideoSection }          from './VideoSection'
import { TabsSection }           from './TabsSection'
import { CarouselSection }       from './CarouselSection'
import { TableSection }          from './TableSection'
import { AuthHeroSection }       from './AuthHeroSection'
import {
  HeadingSection,
  FeatureListSection,
  TestimonialsSection,
  FaqSection,
  PricingSection,
  BannerSection,
  ColumnsSection,
  SpacerSection,
  DividerSection,
  NewsletterSection,
  NotFoundSection,
} from './newSections'
import { TimelineSection, TeamSection, LogoBarSection } from './TimelineTeamLogoBar'

// ── Auth sections ─────────────────────────────────────────────────────────────
import { LoginSection }          from './LoginSection'
import { SignupSection }         from './SignupSection'
import { AuthFormSection }       from './AuthFormSection'

// ── Post detail ───────────────────────────────────────────────────────────────
import { PostDetailPageSection }      from './PostDetailPageSection'
import { PostDetailHeaderSection }    from './PostDetailHeaderSection'
import { PostDetailMetaSection }      from './PostDetailMetaSection'
import { PostDetailBodySection }      from './PostDetailBodySection'
import { PostDetailTagsSection }      from './PostDetailTagsSection'
import { PostDetailBackLinkSection }  from './PostDetailBackLinkSection'

// ── App page sections ─────────────────────────────────────────────────────────
import { PostsPageSection }          from './PostsPageSection'
// Posts sub-sections
import { PostsHeaderSection }        from './PostsHeaderSection'
import { PostsStatsSection }         from './PostsStatsSection'
import { PostsActionsSection }       from './PostsActionsSection'
import { PostsSearchSection }        from './PostsSearchSection'
import { PostsTableSection }         from './PostsTableSection'
import { AnalyticsSection }          from './AnalyticsSection'
import { SettingsSection }           from './SettingsSection'
import { BillingSection }            from './BillingSection'
import { AdminSection }              from './AdminSection'
// Billing sub-sections
import { BillingHeaderSection }      from './BillingHeaderSection'
import { BillingCurrentPlanSection } from './BillingCurrentPlanSection'
import { BillingUsageSection }       from './BillingUsageSection'
import { BillingPlansGridSection }   from './BillingPlansGridSection'
import { BillingFooterSection }      from './BillingFooterSection'
import { BillingSuccessHeroSection }    from './BillingSuccessHeroSection'
import { BillingSuccessActionsSection } from './BillingSuccessActionsSection'
// Settings sub-sections
import { SettingsHeaderSection }     from './SettingsHeaderSection'
import { SettingsInfoSection }       from './SettingsInfoSection'
import { SettingsFormSection }       from './SettingsFormSection'
import { SettingsDangerSection }     from './SettingsDangerSection'

// ─────────────────────────────────────────────────────────────────────────────

interface SectionRendererProps {
  sections: CmsSection[]
  lang?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySection = any

export async function SectionRenderer({ sections, lang = 'en' }: SectionRendererProps) {
  return (
    <>
      {sections.map((section, i) => {
        if (!section) return null

        const key = ('_key' in section && section._key)
          ? section._key
          : ('_id' in section && (section as AnySection)._id)
            ? (section as AnySection)._id
            : `section-${i}`
        const s = section as AnySection

        // ── Component documents (sections[]-> dereferenced) ───────────────
        // _type === 'component' means it's a component document.
        // Dispatch directly to ComponentRenderer with the full document.
        if (s._type === 'component') {
          return <ComponentRenderer key={key} component={s} lang={lang} />
        }

        // ── Section documents (sections[]-> dereferenced) ──────────────────
        // _type === 'section' means it's a section document from the architecture.
        // Use sectionType to select the component; pass the named content sub-object.
        if (s._type === 'section') {
          switch (s.sectionType as string) {
            case 'hero':          return <HeroSection          key={key} section={s.hero ?? {}} />
            case 'featuredPosts': return <FeaturedPostsSection  key={key} section={s.featuredPosts ?? {}} lang={lang} />
            case 'recentPosts':   return <RecentPostsSection    key={key} section={s.recentPosts ?? {}} lang={lang} />
            case 'cta':           return <CtaSection            key={key} section={s.cta ?? {}} />
            case 'authHero':      return <AuthHeroSection       key={key} section={s.authHero ?? {}} />
            case 'authForm':      return <AuthFormSection       key={key} section={s.authForm ?? {}} />
            case 'features':      return <FeatureListSection    key={key} section={s.features ?? {}} />
            case 'postsList':          return <PostsPageSection          key={key} lang={lang} />
            case 'postDetail':         return <PostDetailPageSection      key={key} section={s.postDetail ?? {}} />
            // Post Detail sub-sections (config-only — no visible UI in page builder)
            case 'postDetailHeader':   return <PostDetailHeaderSection    key={key} content={s.postDetailHeader ?? {}} />
            case 'postDetailMeta':     return <PostDetailMetaSection      key={key} content={s.postDetailMeta ?? {}} />
            case 'postDetailBody':     return <PostDetailBodySection      key={key} content={s.postDetailBody ?? {}} />
            case 'postDetailTags':     return <PostDetailTagsSection      key={key} content={s.postDetailTags ?? {}} />
            case 'postDetailBackLink': return <PostDetailBackLinkSection  key={key} content={s.postDetailBackLink ?? {}} />
            // Posts sub-sections
            case 'postsHeader':   return <PostsHeaderSection    key={key} content={s.postsHeader ?? {}} />
            case 'postsStats':    return <PostsStatsSection     key={key} content={s.postsStats ?? {}} lang={lang} />
            case 'postsActions':  return <PostsActionsSection   key={key} content={s.postsActions ?? {}} lang={lang} />
            case 'postsSearch':   return <PostsSearchSection    key={key} content={s.postsSearch ?? {}} />
            case 'postsTable':    return <PostsTableSection     key={key} content={s.postsTable ?? {}} lang={lang} />
            case 'analytics':          return <AnalyticsSection          key={key} lang={lang} content={s.analytics ?? {}} />
            // Billing sub-sections
            case 'billingHeader':      return <BillingHeaderSection      key={key} content={s.billingHeader ?? {}} />
            case 'billingCurrentPlan': return <BillingCurrentPlanSection key={key} content={s.billingCurrentPlan ?? {}} />
            case 'billingUsage':       return <BillingUsageSection       key={key} content={s.billingUsage ?? {}} />
            case 'billingPlansGrid':   return <BillingPlansGridSection   key={key} content={s.billingPlansGrid ?? {}} />
            case 'billingFooter':      return <BillingFooterSection      key={key} content={s.billingFooter ?? {}} />
            case 'billingSuccessHero':    return <BillingSuccessHeroSection    key={key} content={s.billingSuccessHero ?? {}} />
            case 'billingSuccessActions': return <BillingSuccessActionsSection key={key} content={s.billingSuccessActions ?? {}} />
            // Settings sub-sections
            case 'settingsHeader':     return <SettingsHeaderSection     key={key} content={s.settingsHeader ?? {}} />
            case 'settingsInfo':       return <SettingsInfoSection       key={key} content={s.settingsInfo ?? {}} />
            case 'settingsForm':       return <SettingsFormSection       key={key} content={s.settingsForm ?? {}} />
            case 'settingsDanger':     return <SettingsDangerSection     key={key} content={s.settingsDanger ?? {}} />
            // Legacy single-section fallbacks
            case 'settings':      return <SettingsSection       key={key} lang={lang} />
            case 'billing':       return <BillingSection        key={key} lang={lang} />
            case 'admin':         return <AdminSection          key={key} lang={lang} content={s.admin ?? {}} />
            default:
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[SectionRenderer] Unknown sectionType: "${s.sectionType}" on section doc "${s._id}"`)
              }
              return null
          }
        }

        // ── Legacy inline section objects (backward compatibility) ─────────
        // These handle any inline objects that may exist in the dataset from
        // before the section-document architecture migration.
        switch (s._type as string) {
          case 'heroSection':          return <HeroSection          key={key} section={s} />
          case 'featuresSection':      return <FeatureListSection    key={key} section={s} />
          case 'ctaSection':           return <CtaSection            key={key} section={s} />
          case 'featuredPostsSection': return <FeaturedPostsSection  key={key} section={s} lang={lang} />
          case 'recentPostsSection':   return <RecentPostsSection    key={key} section={s} lang={lang} />
          case 'postsSection':         return <PostsPageSection      key={key} lang={lang} />
          case 'authSection':          return <AuthFormSection       key={key} section={s} />
          case 'authHeroSection':      return <AuthHeroSection       key={key} section={s} />
          case 'analyticsSection':     return <AnalyticsSection      key={key} lang={lang} content={{}} />
          case 'navbarSection':
          case 'footerSection':
            return null

          case 'richTextSection':      return <RichTextSection       key={key} section={s} />
          case 'statsSection':         return <StatsSection          key={key} section={s} />
          case 'formSection':          return <FormSection           key={key} section={s} />
          case 'gridSection':          return <GridSection           key={key} section={s} />
          case 'columnsSection':       return <ColumnsSection        key={key} section={s} />
          case 'spacerSection':        return <SpacerSection         key={key} section={s} />
          case 'dividerSection':       return <DividerSection        key={key} section={s} />
          case 'headingSection':       return <HeadingSection        key={key} section={s} />
          case 'featureListSection':   return <FeatureListSection    key={key} section={s} />
          case 'testimonialsSection':  return <TestimonialsSection   key={key} section={s} />
          case 'faqSection':           return <FaqSection            key={key} section={s} />
          case 'pricingSection':       return <PricingSection        key={key} section={s} />
          case 'teamSection':          return <TeamSection           key={key} section={s} />
          case 'logoBarSection':       return <LogoBarSection        key={key} section={s} />
          case 'carouselSection':      return <CarouselSection       key={key} section={s} />
          case 'tableSection':         return <TableSection          key={key} section={s} />
          case 'timelineSection':      return <TimelineSection       key={key} section={s} />
          case 'bannerSection':        return <BannerSection         key={key} section={s} />
          case 'tabsSection':          return <TabsSection           key={key} section={s} />
          case 'imageSection':         return <ImageSection          key={key} section={s} />
          case 'gallerySection':       return <GallerySection        key={key} section={s} />
          case 'videoSection':         return <VideoSection          key={key} section={s} />
          case 'newsletterSection':    return <NewsletterSection     key={key} section={s} />
          case 'notFoundSection':      return <NotFoundSection       key={key} section={s} />
          case 'contactSection':       return null

          case 'loginSection':
          case 'loginPageSection':     return <LoginSection          key={key} section={s} lang={lang} />
          case 'signupSection':
          case 'signupPageSection':    return <SignupSection         key={key} section={s} lang={lang} />

          case 'postDetailPageSection': return <PostDetailPageSection key={key} section={s} />

          case 'postsPageSection':     return <PostsPageSection      key={key} lang={lang} />
          case 'analyticsPageSection': return <AnalyticsSection      key={key} lang={lang} content={{}} />
          case 'settingsPageSection':  return <SettingsSection       key={key} lang={lang} />
          case 'billingPageSection':   return <BillingSection        key={key} lang={lang} />
          case 'adminPageSection':     return <AdminSection          key={key} lang={lang} content={{}} />

          default:
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[SectionRenderer] Unknown section type: "${s._type}"`)
            }
            return null
        }
      })}
    </>
  )
}
