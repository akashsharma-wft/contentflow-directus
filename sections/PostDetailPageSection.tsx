// sections/PostDetailPageSection.tsx
//
// Marker section that signals a page should render post detail content.
// Receives configuration from the `postDetail` content sub-object in the
// section document (sectionType === 'postDetail').
//
// The actual post body is fetched by the route file (app/posts/[slug]/page.tsx
// or app/[lang]/posts/[slug]/page.tsx) using the URL slug parameter. This
// section acts as configuration — should the detail page show the author,
// publish date, and tags?
//
// On pages that DON'T have a dedicated route (e.g. a page-builder page that
// embeds a postDetail section), this renders a placeholder.

import type { SectionPostDetailContent } from '@/types/cms'

interface Props {
  // New schema shape (sectionType === 'postDetail')
  section?: SectionPostDetailContent
}

export function PostDetailPageSection({ section }: Props) {
  const showAuthor      = section?.showAuthor      ?? true
  const showPublishedAt = section?.showPublishedAt ?? true
  const showTags        = section?.showTags        ?? true

  // This section is a marker — the route file (not yet created) will use these
  // config values when rendering the full post detail. Expose them as data
  // attributes so the presentation tool can surface them.
  return (
    <div
      className="w-full"
      data-section="postDetail"
      data-show-author={String(showAuthor)}
      data-show-published-at={String(showPublishedAt)}
      data-show-tags={String(showTags)}
    >
      {/* Rendered by app/posts/[slug]/page.tsx or app/[lang]/posts/[slug]/page.tsx */}
    </div>
  )
}
