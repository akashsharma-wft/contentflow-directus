// sections/AnalyticsSection.tsx
import type { SectionAnalyticsContent } from '@/types/cms'
import { PostHogEventsClient } from '@/features/analytics/components/PostHogEventsClient'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  lang?: string
  content?: SectionAnalyticsContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function AnalyticsSection({ content = {}, translationId, translationRow }: Props) {
  const serverFlags = { showFeaturedBanner: false }

  // Merge translationRow fields over the content blob so PostHogEventsClient
  // renders the correct CMS strings without knowing about translationRow.
  const mergedConfig: SectionAnalyticsContent = {
    ...content,
    heading:    translationRow?.analytics_heading    ?? content.heading,
    subheading: translationRow?.analytics_subheading ?? content.subheading,
    emptyTitle: translationRow?.analytics_empty_title ?? content.emptyTitle,
    emptyBody:  translationRow?.analytics_empty_body  ?? content.emptyBody,
  }

  // Attr values for individual field bindings — passed into PostHogEventsClient
  // so it can apply them to the exact DOM elements that render those strings.
  const attrMap = {
    headingAttr:    pageAttr(translationId, 'analytics_heading'),
    subheadingAttr: pageAttr(translationId, 'analytics_subheading'),
    emptyTitleAttr: pageAttr(translationId, 'analytics_empty_title'),
    emptyBodyAttr:  pageAttr(translationId, 'analytics_empty_body'),
  }

  return (
    <PostHogEventsClient
      config={mergedConfig}
      serverFlags={serverFlags}
      attrMap={attrMap}
    />
  )
}