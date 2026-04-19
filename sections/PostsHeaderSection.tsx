// sections/PostsHeaderSection.tsx
//
// Server component — renders the heading, badge, and subheading for /posts.
// Receives CMS labels from the postsHeader section config.

import type { SectionPostsHeaderContent } from '@/types/cms'

interface Props {
  content: SectionPostsHeaderContent
}

export function PostsHeaderSection({ content }: Props) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1 className="text-white text-2xl font-bold tracking-tight">
          {content.heading ?? 'Blog Posts'}
        </h1>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
          {content.apiBadgeLabel ?? 'via Directus'}
        </span>
      </div>
      <p className="text-white/35 text-sm">
        {content.subheading ?? 'Manage your technical documentation and editorial content.'}
      </p>
    </div>
  )
}
