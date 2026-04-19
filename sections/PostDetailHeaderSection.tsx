// sections/PostDetailHeaderSection.tsx
//
// Configuration section for the post detail page header.
// Configures: page heading label, featured badge label, language badge label,
// "Edit in Studio" link label.
//
// NOTE: This section does not render visible post content — it provides CMS-
// editable config that the route file (app/[lang]/[slug]/page.tsx) reads and
// passes to the PostDetail component. In the Studio page builder, it shows a
// small config summary.

import type { SectionPostDetailHeaderContent } from '@/types/cms'

interface Props {
  content: SectionPostDetailHeaderContent
}

export function PostDetailHeaderSection({ content }: Props) {
  // Config-only section — rendered content appears in app/[lang]/[slug]/page.tsx
  // via the PostDetail component. This is a preview/placeholder for the Studio.
  return (
    <div
      className="w-full"
      data-section="postDetailHeader"
      data-heading={content.heading ?? 'Post Detail'}
      data-featured-badge={content.featuredBadgeLabel ?? 'Featured'}
    />
  )
}
