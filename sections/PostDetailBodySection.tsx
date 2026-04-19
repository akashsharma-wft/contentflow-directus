// sections/PostDetailBodySection.tsx
//
// Configuration section for the post detail body area.
// Config consumed by app/[lang]/[slug]/page.tsx → PostDetail component.

import type { SectionPostDetailBodyContent } from '@/types/cms'

interface Props {
  content: SectionPostDetailBodyContent
}

export function PostDetailBodySection({ content }: Props) {
  return (
    <div
      className="w-full"
      data-section="postDetailBody"
      data-empty-body={content.emptyBodyText ?? 'No content yet.'}
    />
  )
}
