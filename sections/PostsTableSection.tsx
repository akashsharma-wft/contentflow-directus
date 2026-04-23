// sections/PostsTableSection.tsx
//
// Client component — fetches posts (language-filtered), reads search from Zustand,
// and renders PostsTable with pagination and image column support.
//
// Query key: ['posts', 'all', lang]
//   Owned exclusively by this section. PostsStatsSection uses ['posts', 'stats', lang].
//   Both share the prefix ['posts'] so a single invalidateQueries({ queryKey: ['posts'] })
//   hits both — used by Sync, create, edit, delete.
//
// Auth-loading guard: React Query v5 returns isLoading=false when enabled=false, so
// we check authLoading separately to show the skeleton while Supabase resolves the
// session rather than flashing the empty state before the fetch even starts.

'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { useUIStore } from '@/stores/uiStore'
import { useDebounce } from '@/hooks/useDebounce'
import { PostsTable } from '@/features/posts/components/PostsTable'
import { PostsEmptyState } from '@/features/posts/components/PostsEmptyState'
import { PostsTableSkeleton } from '@/features/posts/components/PostsTableSkeleton'
import { FeaturedBanner } from '@/features/posts/components/FeaturedBanner'
import type { SectionPostsTableContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  content: SectionPostsTableContent
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export interface PostItem {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt: string | null
  featured: boolean
  tags: string[]
  authorId?: string
  authorName?: string
  coverImage?: string
  language?: string
}

// Stable query key for this section. Exported so PostsTable can receive it as a prop.
export function postsTableQueryKey(lang: string) {
  return ['posts', 'all', lang] as const
}

export function PostsTableSection({ content, lang = 'en' }: Props) {
  const { user, isLoading: authLoading } = useUser()
  const { postsSearchQuery } = useUIStore()
  const debouncedSearch = useDebounce(postsSearchQuery, 300)

  const queryKey = postsTableQueryKey(lang)

  const { data: allPosts, isLoading, isError, refetch } = useQuery<PostItem[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/posts?lang=${lang}`)
      if (!res.ok) throw new Error('Failed to load posts')
      return (await res.json()) as PostItem[]
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const posts = (allPosts ?? []).map((p) => ({
    ...p,
    status: (p.publishedAt ? 'published' : 'draft') as 'published' | 'draft',
  }))

  const filteredPosts = debouncedSearch
    ? posts.filter(
        (p) =>
          (p.title ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase())),
      )
    : posts

  const featuredPosts = posts.filter((p) => p.featured)

  // Show skeleton while auth is resolving (user not yet known) OR while first fetch runs.
  // Without this guard, React Query v5 returns isLoading=false when enabled=false,
  // which would immediately render the empty state before the session is even checked.
  const showSkeleton = authLoading || isLoading

  return (
    <div>
      {/* Featured banner — mb-4 provides consistent gap before the table */}
      {featuredPosts.length > 0 && (
        <div className="mb-4">
          <FeaturedBanner
            posts={featuredPosts}
            featuredLabel={content.featuredLabel}
            featuredOfLabel={content.featuredOfLabel}
            featuredReadLabel={content.featuredReadLabel}
            bannerIcon={content.featuredBannerIcon}
          />
        </div>
      )}

      {showSkeleton ? (
        <PostsTableSkeleton />
      ) : isError ? (
        <div className="flex items-center justify-center py-12 bg-[#13141c] border border-white/5 rounded-2xl">
          <p className="text-red-400 text-sm">Failed to load posts. Try syncing.</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <PostsEmptyState
          title={content.emptyTitle}
          body={content.emptyBody}
          ctaLabel={content.emptyCtaLabel}
          onSync={() => refetch()}
        />
      ) : (
        <PostsTable
          posts={filteredPosts}
          lang={lang}
          queryKey={[...queryKey]}
          colTitle={content.colTitle}
          colStatus={content.colStatus}
          colImage={content.colImage}
          colTags={content.colTags}
          colLastModified={content.colLastModified}
          showingLabel={content.showingLabel}
          loadMoreLabel={content.loadMoreLabel}
          connectedLabel={content.connectedLabel}
          viewPostLabel={content.viewPostLabel}
          editPostLabel={content.editPostLabel}
          deletePostLabel={content.deletePostLabel}
          deleteDialogTitle={content.deleteDialogTitle}
          deleteDialogBody={content.deleteDialogBody}
          deleteDialogConfirmLabel={content.deleteDialogConfirmLabel}
          deleteDialogCancelLabel={content.deleteDialogCancelLabel}
        />
      )}
    </div>
  )
}
