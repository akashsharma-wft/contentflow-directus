// sections/PostsSearchSection.tsx
//
// Client component — renders the search input for the posts table.
// Writes to Zustand `postsSearchQuery` so PostsTableSection can read and filter.
// Clears search on unmount to avoid stale state when navigating away.

'use client'

import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import type { SectionPostsSearchContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  content: SectionPostsSearchContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function PostsSearchSection({ content }: Props) {
  const { postsSearchQuery, setPostsSearchQuery } = useUIStore()

  // Clear search when component unmounts (navigating away)
  useEffect(() => {
    return () => setPostsSearchQuery('')
  }, [setPostsSearchQuery])

  return (
    <div className="relative mb-5">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
      <input
        type="text"
        placeholder={content.searchPlaceholder ?? 'Search posts...'}
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
