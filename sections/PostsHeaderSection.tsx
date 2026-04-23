// sections/PostsHeaderSection.tsx
import type { SectionPostsHeaderContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionPostsHeaderContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function PostsHeaderSection({ content, translationId, translationRow }: Props) {
  const heading      = translationRow?.posts_heading    ?? content.heading      ?? 'Blog Posts'
  const apiBadge     = translationRow?.posts_api_badge  ?? content.apiBadgeLabel ?? 'via Directus'
  const subheading   = translationRow?.posts_subheading ?? content.subheading   ?? 'Manage your technical documentation and editorial content.'

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1
          data-directus={pageAttr(translationId, 'posts_heading')}
          className="text-white text-2xl font-bold tracking-tight"
        >
          {heading}
        </h1>
        <span
          data-directus={pageAttr(translationId, 'posts_api_badge')}
          className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded"
        >
          {apiBadge}
        </span>
      </div>
      <p
        data-directus={pageAttr(translationId, 'posts_subheading')}
        className="text-white/35 text-sm"
      >
        {subheading}
      </p>
    </div>
  )
}