// sections/PostDetailMetaSection.tsx
//
// Configuration section for the post detail meta row (author, date).
// Config consumed by app/[lang]/[slug]/page.tsx → PostDetail component.

import type { SectionPostDetailMetaContent } from '@/types/cms'

interface Props {
  content: SectionPostDetailMetaContent
}

export function PostDetailMetaSection({ content }: Props) {
  return (
    <div
      className="w-full"
      data-section="postDetailMeta"
      data-unpublished-label={content.unpublishedLabel ?? 'Unpublished'}
    />
  )
}
