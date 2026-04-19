// sections/PostDetailBackLinkSection.tsx
//
// Configuration section for the post detail back/navigation links.
// Config consumed by app/[lang]/[slug]/page.tsx → PostDetail component.

import type { SectionPostDetailBackLinkContent } from '@/types/cms'

interface Props {
  content: SectionPostDetailBackLinkContent
}

export function PostDetailBackLinkSection({ content }: Props) {
  return (
    <div
      className="w-full"
      data-section="postDetailBackLink"
      data-back-label={content.backLabel ?? 'Back to Posts'}
      data-back-href={content.backHref ?? '/posts'}
    />
  )
}
