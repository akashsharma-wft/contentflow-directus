// features/posts/components/PostsPageClient.tsx
// Full posts page client component. Receives CMS config as props.
// Contains all the interactive logic: search, sync, query, filtering.
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { RefreshCw, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PostsStatsBar } from './PostsStatsBar'
import { PostsTable } from './PostsTable'
import { PostsEmptyState } from './PostsEmptyState'
import { PostsTableSkeleton } from './PostsTableSkeleton'
import { FeaturedBanner } from './FeaturedBanner'
import { CreatePostModal } from './CreatePostModal'

interface PostsPageConfig {
  heading?: string
  subheading?: string
  apiBadgeLabel?: string
  syncButtonLabel?: string
  newPostButtonLabel?: string
  myPostsLabel?: string
  publishedLabel?: string
  draftsLabel?: string
  searchPlaceholder?: string
  colTitle?: string
  colStatus?: string
  colTags?: string
  colLastModified?: string
  emptyTitle?: string
  emptyBody?: string
  emptyCtaLabel?: string
}

interface PostsPageClientProps {
  config: PostsPageConfig
}

interface PostItem {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt: string | null
  featured: boolean
  tags: string[]
  authorId?: string
  authorName?: string
  authorEmail?: string
  authorAvatar?: string
  coverImage?: string
  language?: string
}

export function PostsPageClient({ config }: PostsPageClientProps) {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: allFetchedPosts, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', 'all', 'en'],
    queryFn: async () => {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed to load posts')
      return res.json() as Promise<PostItem[]>
    },
    enabled: !!user?.id,
    staleTime: 0,
  })

  async function handleSync() {
    setIsSyncing(true)
    try {
      await refetch()
      toast.success('Posts refreshed')
    } catch {
      toast.error('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const posts = (allFetchedPosts ?? []) as PostItem[]

  // Add status derived field
  const postsWithStatus = posts.map((p) => ({
    ...p,
    status: (p.publishedAt ? 'published' : 'draft') as 'published' | 'draft',
  }))

  // Filter by search query
  const filteredPosts = debouncedSearch
    ? postsWithStatus.filter(
        (p) =>
          p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : postsWithStatus

  // Stats
  const myPosts = postsWithStatus.filter((p) => p.authorId === user?.id)
  const published = myPosts.filter((p) => p.status === 'published').length
  const drafts = myPosts.filter((p) => p.status === 'draft').length
  const featuredPosts = postsWithStatus.filter((p) => p.featured)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="w-full flex items-start justify-between gap-5 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {config.heading ?? 'Blog Posts'}
            </h1>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              {config.apiBadgeLabel ?? 'via Directus'}
            </span>
          </div>
          <p className="text-white/35 text-sm">
            {config.subheading ?? 'Manage your technical documentation and editorial content.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : (config.syncButtonLabel ?? 'Sync')}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={13} />
            {config.newPostButtonLabel ?? 'New Post'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <PostsStatsBar
        total={myPosts.length}
        published={published}
        drafts={drafts}
        myPostsLabel={config.myPostsLabel}
        publishedLabel={config.publishedLabel}
        draftsLabel={config.draftsLabel}
      />

      {/* Featured banner (PostHog feature-flagged) */}
      {featuredPosts.length > 0 && <FeaturedBanner posts={featuredPosts} />}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          placeholder={config.searchPlaceholder ?? 'Search posts...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-9 pr-4 py-2.5 bg-[#13141c] border border-white/8 rounded-xl',
            'text-white/70 text-sm placeholder:text-white/20',
            'outline-none focus:border-indigo-500/40 transition-colors'
          )}
        />
      </div>

      {/* Table / loading / empty states */}
      {isLoading ? (
        <PostsTableSkeleton />
      ) : isError ? (
        <div className="flex items-center justify-center py-12 bg-[#13141c] border border-white/5 rounded-2xl">
          <p className="text-red-400 text-sm">Failed to load posts. Try syncing.</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <PostsEmptyState
          title={config.emptyTitle}
          body={config.emptyBody}
          ctaLabel={config.emptyCtaLabel}
          onSync={handleSync}
          isSyncing={isSyncing}
        />
      ) : (
        <PostsTable
          posts={filteredPosts}
          queryKey={['posts', 'all', 'en']}
          lang="en"
          colTitle={config.colTitle}
          colStatus={config.colStatus}
          colTags={config.colTags}
          colLastModified={config.colLastModified}
        />
      )}

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}