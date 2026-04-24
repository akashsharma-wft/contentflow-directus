// sections/SectionRenderer.tsx
//
// Registry: maps CMS section types → React components.
// Now passes translationId + translationRow to every section so each can
// add granular data-directus bindings on individual text elements.

import type { CmsSection } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
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
import { PostsHeaderSection }        from './PostsHeaderSection'
import { PostsStatsSection }         from './PostsStatsSection'
import { PostsActionsSection }       from './PostsActionsSection'
import { PostsSearchSection }        from './PostsSearchSection'
import { PostsTableSection }         from './PostsTableSection'
import { AnalyticsSection }          from './AnalyticsSection'
import { SettingsSection }           from './SettingsSection'
import { BillingSection }            from './BillingSection'
import { AdminSection }              from './AdminSection'
import { BillingHeaderSection }      from './BillingHeaderSection'
import { BillingCurrentPlanSection } from './BillingCurrentPlanSection'
import { BillingUsageSection }       from './BillingUsageSection'
import { BillingPlansGridSection }   from './BillingPlansGridSection'
import { BillingFooterSection }      from './BillingFooterSection'
import { BillingSuccessHeroSection }    from './BillingSuccessHeroSection'
import { BillingSuccessActionsSection } from './BillingSuccessActionsSection'
import { SettingsHeaderSection }     from './SettingsHeaderSection'
import { SettingsInfoSection }       from './SettingsInfoSection'
import { SettingsFormSection }       from './SettingsFormSection'
import { SettingsDangerSection }     from './SettingsDangerSection'

// ─────────────────────────────────────────────────────────────────────────────

interface SectionRendererProps {
  sections:       CmsSection[]
  lang?:          string
  /** ID of the matched pages_translations row — passed to every section for data-directus bindings */
  translationId?: number
  /** Full translation row — passed to every section so they can read individual fields */
  translationRow?: DirectusPageTranslationRow
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySection = any

export async function SectionRenderer({
  sections,
  lang = 'en',
  translationId,
  translationRow,
}: SectionRendererProps) {
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

        if (s._type === 'component') {
          return <ComponentRenderer key={key} component={s} lang={lang} />
        }

        if (s._type === 'section') {
          switch (s.sectionType as string) {
            case 'hero':
              return <HeroSection key={key} section={s.hero ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'featuredPosts':
              return <FeaturedPostsSection key={key} section={s.featuredPosts ?? {}} lang={lang} translationId={translationId} translationRow={translationRow} />
            case 'recentPosts':
              return <RecentPostsSection key={key} section={s.recentPosts ?? {}} lang={lang} translationId={translationId} translationRow={translationRow} />
            case 'cta':
              return <CtaSection key={key} section={s.cta ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'authHero':
              return <AuthHeroSection key={key} section={s.authHero ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'authForm':
              return <AuthFormSection key={key} section={s.authForm ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'features':
              return <FeatureListSection key={key} section={s.features ?? {}} />
            case 'postsList':
              return <PostsPageSection key={key} lang={lang} />
            case 'postDetail':
              return <PostDetailPageSection key={key} section={s.postDetail ?? {}} />
            case 'postDetailHeader':
              return <PostDetailHeaderSection key={key} content={s.postDetailHeader ?? {}} />
            case 'postDetailMeta':
              return <PostDetailMetaSection key={key} content={s.postDetailMeta ?? {}} />
            case 'postDetailBody':
              return <PostDetailBodySection key={key} content={s.postDetailBody ?? {}} />
            case 'postDetailTags':
              return <PostDetailTagsSection key={key} content={s.postDetailTags ?? {}} />
            case 'postDetailBackLink':
              return <PostDetailBackLinkSection key={key} content={s.postDetailBackLink ?? {}} />
            case 'postsHeader':
              return <PostsHeaderSection key={key} content={s.postsHeader ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'postsStats':
              return <PostsStatsSection key={key} content={s.postsStats ?? {}} lang={lang} translationId={translationId} translationRow={translationRow} />
            case 'postsActions':
              return <PostsActionsSection key={key} content={s.postsActions ?? {}} lang={lang} translationId={translationId} translationRow={translationRow} />
            case 'postsSearch':
              return <PostsSearchSection key={key} content={s.postsSearch ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'postsTable':
              return <PostsTableSection key={key} content={s.postsTable ?? {}} lang={lang} translationId={translationId} translationRow={translationRow} />
            case 'analytics':
              return <AnalyticsSection key={key} lang={lang} content={s.analytics ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'billingHeader':
              return <BillingHeaderSection key={key} content={s.billingHeader ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'billingCurrentPlan':
              return <BillingCurrentPlanSection key={key} content={s.billingCurrentPlan ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'billingUsage':
              return <BillingUsageSection key={key} content={s.billingUsage ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'billingPlansGrid':
              return <BillingPlansGridSection key={key} content={s.billingPlansGrid ?? {}} lang={lang} translationId={translationId} translationRow={translationRow} />
            case 'billingFooter':
              return <BillingFooterSection key={key} content={s.billingFooter ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'billingSuccessHero':
              return <BillingSuccessHeroSection key={key} content={s.billingSuccessHero ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'billingSuccessActions':
              return <BillingSuccessActionsSection key={key} content={s.billingSuccessActions ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'settingsHeader':
              return <SettingsHeaderSection key={key} content={s.settingsHeader ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'settingsInfo':
              return <SettingsInfoSection key={key} content={s.settingsInfo ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'settingsForm':
              return <SettingsFormSection key={key} content={s.settingsForm ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'settingsDanger':
              return <SettingsDangerSection key={key} content={s.settingsDanger ?? {}} translationId={translationId} translationRow={translationRow} />
            case 'settings':
              return <SettingsSection key={key} lang={lang} />
            case 'billing':
              return <BillingSection key={key} lang={lang} />
            case 'admin':
              return <AdminSection key={key} lang={lang} content={s.admin ?? {}} translationId={translationId} translationRow={translationRow} />
            default:
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[SectionRenderer] Unknown sectionType: "${s.sectionType}"`)
              }
              return null
          }
        }

        // Legacy inline section objects
        switch (s._type as string) {
          case 'heroSection':
            return <HeroSection key={key} section={s} translationId={translationId} translationRow={translationRow} />
          case 'featuresSection':
            return <FeatureListSection key={key} section={s} />
          case 'ctaSection':
            return <CtaSection key={key} section={s} translationId={translationId} translationRow={translationRow} />
          case 'featuredPostsSection':
            return <FeaturedPostsSection key={key} section={s} lang={lang} translationId={translationId} translationRow={translationRow} />
          case 'recentPostsSection':
            return <RecentPostsSection key={key} section={s} lang={lang} translationId={translationId} translationRow={translationRow} />
          case 'postsSection':
            return <PostsPageSection key={key} lang={lang} />
          case 'authSection':
            return <AuthFormSection key={key} section={s} translationId={translationId} translationRow={translationRow} />
          case 'authHeroSection':
            return <AuthHeroSection key={key} section={s} translationId={translationId} translationRow={translationRow} />
          case 'analyticsSection':
            return <AnalyticsSection key={key} lang={lang} content={{}} translationId={translationId} translationRow={translationRow} />
          case 'navbarSection':
          case 'footerSection':
            return null
          case 'richTextSection':      return <RichTextSection       key={key} section={s} translationId={translationId} />
          case 'statsSection':         return <StatsSection          key={key} section={s} translationId={translationId} />
          case 'formSection':          return <FormSection           key={key} section={s} translationId={translationId} />
          case 'gridSection':          return <GridSection           key={key} section={s} translationId={translationId} />
          case 'columnsSection':       return <ColumnsSection        key={key} section={s} />
          case 'spacerSection':        return <SpacerSection         key={key} section={s} />
          case 'dividerSection':       return <DividerSection        key={key} section={s} />
          case 'headingSection':       return <HeadingSection        key={key} section={s} translationId={translationId} />
          case 'featureListSection':   return <FeatureListSection    key={key} section={s} translationId={translationId} />
          case 'testimonialsSection':  return <TestimonialsSection   key={key} section={s} translationId={translationId} />
          case 'faqSection':           return <FaqSection            key={key} section={s} translationId={translationId} />
          case 'pricingSection':       return <PricingSection        key={key} section={s} translationId={translationId} />
          case 'teamSection':          return <TeamSection           key={key} section={s} translationId={translationId} />
          case 'logoBarSection':       return <LogoBarSection        key={key} section={s} translationId={translationId} />
          case 'carouselSection':      return <CarouselSection       key={key} section={s} translationId={translationId} />
          case 'tableSection':         return <TableSection          key={key} section={s} translationId={translationId} />
          case 'timelineSection':      return <TimelineSection       key={key} section={s} translationId={translationId} />
          case 'bannerSection':        return <BannerSection         key={key} section={s} translationId={translationId} />
          case 'tabsSection':          return <TabsSection           key={key} section={s} translationId={translationId} />
          case 'imageSection':         return <ImageSection          key={key} section={s} translationId={translationId} />
          case 'gallerySection':       return <GallerySection        key={key} section={s} translationId={translationId} />
          case 'videoSection':         return <VideoSection          key={key} section={s} translationId={translationId} />
          case 'newsletterSection':    return <NewsletterSection     key={key} section={s} translationId={translationId} />
          case 'notFoundSection':      return <NotFoundSection       key={key} section={s} />
          case 'contactSection':       return null
          case 'loginSection':
          case 'loginPageSection':
            return <LoginSection key={key} section={s} lang={lang} translationId={translationId} translationRow={translationRow} />
          case 'signupSection':
          case 'signupPageSection':
            return <SignupSection key={key} section={s} lang={lang} translationId={translationId} translationRow={translationRow} />
          case 'postDetailPageSection':  return <PostDetailPageSection key={key} section={s} />
          case 'postsPageSection':       return <PostsPageSection      key={key} lang={lang} />
          case 'analyticsPageSection':
            return <AnalyticsSection key={key} lang={lang} content={{}} translationId={translationId} translationRow={translationRow} />
          case 'settingsPageSection':    return <SettingsSection       key={key} lang={lang} />
          case 'billingPageSection':     return <BillingSection        key={key} lang={lang} />
          case 'adminPageSection':
            return <AdminSection key={key} lang={lang} content={{}} translationId={translationId} translationRow={translationRow} />
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