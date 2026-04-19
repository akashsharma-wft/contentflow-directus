// features/posts/components/PostsTable.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Star, MoreVertical, Eye, Pencil, Trash2, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { localizeHref } from '@/lib/navigation'
import { format } from 'date-fns'
import { EditPostModal } from './EditPostModal'
import { DeletePostDialog } from './DeletePostDialog'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from 'posthog-js/react'

const PAGE_SIZE = 10
const MAX_PAGE_BUTTONS = 5

interface Post {
  _id: string
  title: string
  slug: string
  tags: string[]
  featured: boolean
  publishedAt: string | null
  status: 'published' | 'draft'
  authorId?: string
  coverImage?: string
}

interface PostsTableProps {
  posts: Post[]
  /** The React Query key that owns this data — used for optimistic updates. */
  queryKey: string[]
  lang?: string
  colTitle?: string
  colStatus?: string
  colImage?: string
  colTags?: string
  colLastModified?: string
  showingLabel?: string
  loadMoreLabel?: string
  connectedLabel?: string
  // Row action labels
  viewPostLabel?: string
  editPostLabel?: string
  deletePostLabel?: string
  // Delete dialog labels
  deleteDialogTitle?: string
  deleteDialogBody?: string
  deleteDialogConfirmLabel?: string
  deleteDialogCancelLabel?: string
}

const STATUS_STYLES = {
  published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  draft:     'text-amber-400  bg-amber-500/10  border-amber-500/20',
}

export function PostsTable({
  posts,
  queryKey,
  lang = 'en',
  colTitle        = 'Post Title',
  colStatus       = 'Status',
  colImage        = 'Cover',
  colTags         = 'Tags',
  colLastModified = 'Last Modified',
  showingLabel    = 'Showing',
  loadMoreLabel:  _loadMoreLabel,   // reserved in interface, unused
  connectedLabel  = 'Directus API Connected',
  viewPostLabel   = 'View post',
  editPostLabel   = 'Edit post',
  deletePostLabel = 'Delete post',
  deleteDialogTitle,
  deleteDialogBody,
  deleteDialogConfirmLabel,
  deleteDialogCancelLabel,
}: PostsTableProps) {
  const [editingPost,    setEditingPost]    = useState<Post | null>(null)
  const [deletingPost,   setDeletingPost]   = useState<Post | null>(null)
  const [page,           setPage]           = useState(1)
  const [optimisticState, setOptimisticState] = useState<Map<string, boolean>>(new Map())
  const debounceTimers  = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingValues   = useRef<Map<string, boolean>>(new Map())
  const mounted         = useRef(true)

  const queryClient = useQueryClient()
  const posthog     = usePostHog()
  const { user }    = useUser()

  // Reset to page 1 whenever the posts list changes (search filter, refetch, etc.)
  useEffect(() => { setPage(1) }, [posts.length])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      debounceTimers.current.forEach((timer) => clearTimeout(timer))
      debounceTimers.current.clear()
      pendingValues.current.clear()
    }
  }, [])

  function handleFeaturedToggle(postId: string, currentFeatured: boolean) {
    const currentDisplay = optimisticState.has(postId)
      ? optimisticState.get(postId)!
      : currentFeatured
    const targetFeatured = !currentDisplay

    setOptimisticState((prev) => new Map(prev).set(postId, targetFeatured))
    pendingValues.current.set(postId, targetFeatured)

    const existing = debounceTimers.current.get(postId)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(async () => {
      const finalValue = pendingValues.current.get(postId)
      if (finalValue === undefined || !mounted.current) return
      pendingValues.current.delete(postId)
      debounceTimers.current.delete(postId)

      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured: finalValue }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed')
        }
        if (mounted.current) {
          // Optimistically update cache so all subscribers (stats, table) reflect change
          queryClient.setQueryData(queryKey, (old: Post[] | undefined) =>
            old?.map((p) => (p._id === postId ? { ...p, featured: finalValue } : p)),
          )
          setOptimisticState((prev) => {
            const next = new Map(prev); next.delete(postId); return next
          })
        }
      } catch {
        if (mounted.current) {
          setOptimisticState((prev) => {
            const next = new Map(prev); next.delete(postId); return next
          })
          toast.error('Failed to update featured status — rolled back')
        }
      }
    }, 400)

    debounceTimers.current.set(postId, timer)
  }

  async function confirmDelete() {
    if (!deletingPost) return

    // Optimistically remove from cache before the network call completes.
    // If the DELETE fails we roll back via invalidation.
    queryClient.setQueryData(queryKey, (old: Post[] | undefined) =>
      old?.filter((p) => p._id !== deletingPost._id),
    )
    setDeletingPost(null)

    try {
      const response = await fetch(`/api/posts/${deletingPost._id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // ['posts'] prefix hits both ['posts','all',lang] and ['posts','stats',lang].
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      posthog?.capture('post_deleted', { post_id: deletingPost._id, title: deletingPost.title })
      toast.success('Post deleted')
    } catch (err: unknown) {
      // Roll back: refetch so the post reappears
      queryClient.invalidateQueries({ queryKey })
      toast.error(err instanceof Error ? err.message : 'Delete failed — rolled back')
    }
  }

  const totalPages   = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  const safePage     = Math.min(page, totalPages)
  const pageStart    = (safePage - 1) * PAGE_SIZE
  const visiblePosts = posts.slice(pageStart, pageStart + PAGE_SIZE)

  // Page button range — up to MAX_PAGE_BUTTONS centered around current page
  const halfWindow = Math.floor(MAX_PAGE_BUTTONS / 2)
  const windowStart = Math.max(1, Math.min(safePage - halfWindow, totalPages - MAX_PAGE_BUTTONS + 1))
  const windowEnd   = Math.min(totalPages, windowStart + MAX_PAGE_BUTTONS - 1)
  const pageButtons = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  return (
    <>
      <div className="bg-[#13141c] border border-white/5 rounded-2xl overflow-hidden">
        {/* Column headers — desktop only */}
        <div className="hidden lg:grid grid-cols-[32px_56px_1fr_110px_160px_140px_48px] items-center px-4 py-3 border-b border-white/5">
          {['', colImage, colTitle, colStatus, colTags, colLastModified, ''].map((col, i) => (
            <span key={i} className="text-white/25 text-[10px] uppercase tracking-widest font-medium">
              {col}
            </span>
          ))}
        </div>

        {visiblePosts.map((post, index) => {
          const displayFeatured = optimisticState.has(post._id)
            ? optimisticState.get(post._id)!
            : post.featured
          const isPending  = debounceTimers.current.has(post._id)
          const postHref   = localizeHref('/' + (post.slug ?? ''), lang)

          return (
            <div
              key={post._id}
              className={cn(
                'flex lg:grid lg:grid-cols-[32px_56px_1fr_110px_160px_140px_48px] items-center px-4 py-3 gap-3 group transition-colors hover:bg-white/[0.02]',
                index < visiblePosts.length - 1 && 'border-b border-white/5',
              )}
            >
              {/* Star / featured toggle */}
              <button
                onClick={() => handleFeaturedToggle(post._id, post.featured)}
                className="cursor-pointer transition-all hover:scale-110 active:scale-95 shrink-0"
                aria-label={displayFeatured ? 'Remove from featured' : 'Mark as featured'}
              >
                <Star
                  size={15}
                  className={cn(
                    'transition-all duration-150',
                    displayFeatured ? 'text-amber-400 fill-amber-400' : 'text-white/20 hover:text-white/50',
                    isPending && 'opacity-60 animate-pulse',
                  )}
                />
              </button>

              {/* Cover image thumbnail */}
              <div className="hidden lg:flex items-center shrink-0">
                {post.coverImage ? (
                  <div className="w-10 h-7 rounded overflow-hidden bg-white/5 shrink-0">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={40}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-7 rounded bg-white/5 flex items-center justify-center shrink-0">
                    <ImageIcon size={11} className="text-white/20" />
                  </div>
                )}
              </div>

              {/* Title — drafts show a toast instead of navigating to post detail */}
              {post.status === 'draft' ? (
                <button
                  onClick={() => toast.info('This post is a draft — publish it to make it publicly visible.', { duration: 5000 })}
                  className="text-white/45 text-sm font-medium truncate text-left cursor-pointer hover:text-white/65 transition-colors"
                >
                  {post.title}
                </button>
              ) : (
                <Link
                  href={postHref}
                  className="text-white/80 text-sm font-medium hover:text-white transition-colors truncate"
                >
                  {post.title}
                </Link>
              )}

              {/* Status badge */}
              <span className={cn(
                'hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border w-fit shrink-0',
                STATUS_STYLES[post.status],
              )}>
                {post.status}
              </span>

              {/* Tags */}
              <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
                {(post.tags ?? []).filter(Boolean).slice(0, 2).map((tag, tagIndex) => (
                  <span
                    key={`${post._id}-tag-${tagIndex}`}
                    className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/45 text-[10px] rounded font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Last modified */}
              <span className="hidden lg:block text-white/30 text-xs font-mono">
                {post.publishedAt
                  ? format(new Date(post.publishedAt), 'yyyy-MM-dd HH:mm')
                  : '— Unpublished'}
              </span>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 hover:bg-white/5 p-1.5 rounded-lg transition-all cursor-pointer"
                    aria-label="More options"
                  >
                    <MoreVertical size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#1a1d27] border border-white/10 text-white/70 min-w-[140px]"
                >
                  {post.slug && (
                    post.status === 'draft' ? (
                      <DropdownMenuItem
                        onClick={() => toast.info('This post is a draft — publish it to make it publicly visible.', { duration: 5000 })}
                        className="flex items-center gap-2 cursor-pointer text-sm px-3 py-2 text-white/40"
                      >
                        <Eye size={13} /> {viewPostLabel}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link
                          href={postHref}
                          className="flex items-center gap-2 cursor-pointer hover:text-white text-sm px-3 py-2"
                        >
                          <Eye size={13} /> {viewPostLabel}
                        </Link>
                      </DropdownMenuItem>
                    )
                  )}
                  {post.authorId === user?.id && (
                    <DropdownMenuItem
                      onClick={() => setEditingPost(post)}
                      className="flex items-center gap-2 cursor-pointer text-sm px-3 py-2"
                    >
                      <Pencil size={13} /> {editPostLabel}
                    </DropdownMenuItem>
                  )}
                  {post.authorId === user?.id && (
                    <DropdownMenuItem
                      onClick={() => setDeletingPost(post)}
                      className="flex items-center gap-2 cursor-pointer text-sm px-3 py-2 text-red-400 focus:text-red-400"
                    >
                      <Trash2 size={13} /> {deletePostLabel}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 flex-wrap gap-2">
          <span className="text-white/25 text-[10px] uppercase tracking-widest font-mono">
            {showingLabel} {posts.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, posts.length)} / {posts.length}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1 rounded text-white/30 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={13} />
              </button>

              {pageButtons.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'min-w-[24px] h-6 px-1.5 text-[10px] font-mono rounded transition-colors cursor-pointer',
                    p === safePage
                      ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                      : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/10',
                  )}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1 rounded text-white/30 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 bg-[#0d0e14]/50 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/25 text-[9px] uppercase tracking-widest font-mono">
              {connectedLabel}
            </span>
          </div>
          <span className="text-white/15 text-[9px] font-mono">V2.4.1-Stable</span>
        </div>
      </div>

      <EditPostModal
        open={editingPost !== null}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        currentUserId={user?.id ?? ''}
        queryKey={queryKey}
      />
      <DeletePostDialog
        open={deletingPost !== null}
        onOpenChange={(open) => { if (!open) setDeletingPost(null) }}
        postTitle={deletingPost?.title ?? 'Untitled'}
        onConfirm={confirmDelete}
        dialogTitle={deleteDialogTitle}
        dialogBody={deleteDialogBody}
        confirmLabel={deleteDialogConfirmLabel}
        cancelLabel={deleteDialogCancelLabel}
      />
    </>
  )
}
