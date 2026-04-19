// sections/PostDetailTagsSection.tsx
//
// Configuration section for the post detail tags row.
// Config consumed by app/[lang]/[slug]/page.tsx → PostDetail component.

import type { SectionPostDetailTagsContent } from '@/types/cms'

interface Props {
  content: SectionPostDetailTagsContent
}

export function PostDetailTagsSection({ content }: Props) {
  return (
    <div
      className="w-full"
      data-section="postDetailTags"
      data-tags-heading={content.tagsHeading ?? 'Tags'}
    />
  )
}
