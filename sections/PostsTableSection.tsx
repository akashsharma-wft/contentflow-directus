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
import { pageAttr } from '@/lib/directus/section-binding'

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

export function postsTableQueryKey(lang: string) {
  return ['posts', 'all', lang] as const
}

export function PostsTableSection({ content, lang = 'en', translationId, translationRow }: Props) {
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
  const showSkeleton = authLoading || isLoading

  // Resolve all label strings: translationRow > content blob > undefined (child uses its own default)
  const colTitle     = translationRow?.posts_col_title   ?? content.colTitle
  const colStatus    = translationRow?.posts_col_status  ?? content.colStatus
  const colTags      = translationRow?.posts_col_tags    ?? content.colTags
  const colLastMod   = translationRow?.posts_col_modified ?? content.colLastModified
  const emptyTitle   = translationRow?.posts_empty_title ?? content.emptyTitle
  const emptyBody    = translationRow?.posts_empty_body  ?? content.emptyBody
  const emptyCtaLabel = translationRow?.posts_empty_cta  ?? content.emptyCtaLabel
  const loadMoreLabel = translationRow?.posts_load_more  ?? content.loadMoreLabel

  const featuredLabel     = translationRow?.posts_featured_label      ?? content.featuredLabel
  const featuredOfLabel   = translationRow?.posts_featured_of_label   ?? content.featuredOfLabel
  const featuredReadLabel = translationRow?.posts_featured_read_label ?? content.featuredReadLabel

  return (
    <div>
      {featuredPosts.length > 0 && (
        <div className="mb-4">
          <FeaturedBanner
            posts={featuredPosts}
            featuredLabel={featuredLabel}
            featuredOfLabel={featuredOfLabel}
            featuredReadLabel={featuredReadLabel}
            bannerIcon={content.featuredBannerIcon}
            featuredLabelAttr={pageAttr(translationId, 'posts_featured_label')}
            featuredOfLabelAttr={pageAttr(translationId, 'posts_featured_of_label')}
            featuredReadLabelAttr={pageAttr(translationId, 'posts_featured_read_label')}
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
          title={emptyTitle}
          body={emptyBody}
          ctaLabel={emptyCtaLabel}
          onSync={() => refetch()}
          // Bind empty state heading so editor can click it in visual editing
          titleAttr={pageAttr(translationId, 'posts_empty_title')}
          bodyAttr={pageAttr(translationId, 'posts_empty_body')}
          ctaAttr={pageAttr(translationId, 'posts_empty_cta')}
        />
      ) : (
        <PostsTable
          posts={filteredPosts}
          lang={lang}
          queryKey={[...queryKey]}
          colTitle={colTitle}
          colStatus={colStatus}
          colImage={content.colImage}
          colTags={colTags}
          colLastModified={colLastMod}
          showingLabel={content.showingLabel}
          loadMoreLabel={loadMoreLabel}
          connectedLabel={content.connectedLabel}
          viewPostLabel={content.viewPostLabel}
          editPostLabel={content.editPostLabel}
          deletePostLabel={content.deletePostLabel}
          deleteDialogTitle={content.deleteDialogTitle}
          deleteDialogBody={content.deleteDialogBody}
          deleteDialogConfirmLabel={content.deleteDialogConfirmLabel}
          deleteDialogCancelLabel={content.deleteDialogCancelLabel}
          // Column header bindings so hovering them opens the exact field
          colTitleAttr={pageAttr(translationId, 'posts_col_title')}
          colStatusAttr={pageAttr(translationId, 'posts_col_status')}
          colTagsAttr={pageAttr(translationId, 'posts_col_tags')}
          colLastModifiedAttr={pageAttr(translationId, 'posts_col_modified')}
          loadMoreAttr={pageAttr(translationId, 'posts_load_more')}
        />
      )}
    </div>
  )
}