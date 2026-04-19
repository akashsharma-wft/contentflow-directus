// sections/PostsStatsSection.tsx
//
// Derives stats (My Posts / Published / Drafts) from its own dedicated cache entry.
//
// Query key: ['posts', 'stats', lang]
//   Deliberately DIFFERENT from PostsTableSection (['posts', 'all', lang]).
//   Sharing a key between two components with different projections caused the
//   stats queryFn (which only fetches _id/authorId/publishedAt) to win the
//   initial-load race and poison the table cache with incomplete data.
//
// Invalidation: use queryKey prefix ['posts'] to hit both 'all' and 'stats' at once.

'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { PostsStatsBar } from '@/features/posts/components/PostsStatsBar'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionPostsStatsContent } from '@/types/cms'

interface Props {
  content: SectionPostsStatsContent
  lang?: string
}

interface PostMeta {
  _id: string
  authorId?: string
  publishedAt: string | null
  language?: string
}

export function PostsStatsSection({ content, lang = 'en' }: Props) {
  const { user, isLoading: authLoading } = useUser()

  const { data: posts = [], isLoading } = useQuery<PostMeta[]>({
    queryKey: ['posts', 'stats', lang],
    queryFn: async () => {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed')
      const data = (await res.json()) as PostMeta[]
      return data.filter(p => !lang || p.language === lang || (!p.language && lang === 'en'))
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  if (authLoading || isLoading) {
    return (
      <div className="mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  const myPosts   = posts.filter((p) => p.authorId === user?.id)
  const published = myPosts.filter((p) => !!p.publishedAt).length
  const drafts    = myPosts.filter((p) => !p.publishedAt).length

  return (
    <div className="mb-5">
      <PostsStatsBar
        total={myPosts.length}
        published={published}
        drafts={drafts}
        myPostsLabel={content.myPostsLabel}
        publishedLabel={content.publishedLabel}
        draftsLabel={content.draftsLabel}
      />
    </div>
  )
}
