// sections/AnalyticsSection.tsx
//
// Mounts PostHogEventsClient with CMS-driven labels from the section document.
// Content is now passed in from SectionRenderer (no singleton fetch needed).
import type { SectionAnalyticsContent } from '@/types/cms'
import { PostHogEventsClient } from '@/features/analytics/components/PostHogEventsClient'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  lang?: string
  content?: SectionAnalyticsContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function AnalyticsSection({ content = {} }: Props) {
  const serverFlags = { showFeaturedBanner: false }
  return <PostHogEventsClient config={content} serverFlags={serverFlags} />
}
