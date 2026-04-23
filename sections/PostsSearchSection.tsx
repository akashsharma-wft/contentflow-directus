'use client'

import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import type { SectionPostsSearchContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionPostsSearchContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function PostsSearchSection({ content, translationId, translationRow }: Props) {
  const { postsSearchQuery, setPostsSearchQuery } = useUIStore()

  useEffect(() => {
    return () => setPostsSearchQuery('')
  }, [setPostsSearchQuery])

  const placeholder = translationRow?.posts_search_placeholder ?? content.searchPlaceholder ?? 'Search posts...'

  return (
    <div className="relative mb-5">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        data-directus={pageAttr(translationId, 'posts_search_placeholder')}
        value={postsSearchQuery}
        onChange={(e) => setPostsSearchQuery(e.target.value)}
        className={cn(
          'w-full pl-9 pr-4 py-2.5 bg-[#13141c] border border-white/8 rounded-xl',
          'text-white/70 text-sm placeholder:text-white/20',
          'outline-none focus:border-indigo-500/40 transition-colors',
        )}
      />
    </div>
  )
}