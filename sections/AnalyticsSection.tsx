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
    heading:      translationRow?.analytics_heading      ?? content.heading,
    subheading:   translationRow?.analytics_subheading   ?? content.subheading,
    eventsLabel:  translationRow?.analytics_events_label ?? content.eventsLabel,
    usersLabel:   translationRow?.analytics_users_label  ?? content.usersLabel,
    emptyTitle:   translationRow?.analytics_empty_title  ?? content.emptyTitle,
    emptyBody:    translationRow?.analytics_empty_body   ?? content.emptyBody,
    refreshLabel: translationRow?.analytics_refresh_label ?? content.refreshLabel,
    prevLabel:    translationRow?.analytics_prev_label   ?? content.prevLabel,
    nextLabel:    translationRow?.analytics_next_label   ?? content.nextLabel,
  }

  const attrMap = {
    headingAttr:    pageAttr(translationId, 'analytics_heading'),
    subheadingAttr: pageAttr(translationId, 'analytics_subheading'),
    eventsLabelAttr: pageAttr(translationId, 'analytics_events_label'),
    usersLabelAttr:  pageAttr(translationId, 'analytics_users_label'),
    emptyTitleAttr:  pageAttr(translationId, 'analytics_empty_title'),
    emptyBodyAttr:   pageAttr(translationId, 'analytics_empty_body'),
    refreshLabelAttr: pageAttr(translationId, 'analytics_refresh_label'),
    prevLabelAttr:   pageAttr(translationId, 'analytics_prev_label'),
    nextLabelAttr:   pageAttr(translationId, 'analytics_next_label'),
  }

  return (
    <PostHogEventsClient
      config={mergedConfig}
      serverFlags={serverFlags}
      attrMap={attrMap}
    />
  )
}