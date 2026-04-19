'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Post {
  _id: string
  title: string
  slug: string
  publishedAt: string | null
  featured: boolean
  tags: string[] | null
  authorName?: string
}

interface LivePreviewClientProps {
  posts: Post[]
  isPreview: boolean
  userId: string  // add this
}

export function LivePreviewClient({ posts, isPreview }: LivePreviewClientProps) {
  const router = useRouter()

  function togglePreview() {
    if (isPreview) {
      router.push('/posts/preview')
    } else {
      router.push('/posts/preview?preview=true')
    }
  }

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-white text-2xl font-bold tracking-tight">Live Preview</h1>
            {isPreview && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/25 rounded-full animate-pulse">
                Draft Mode
              </span>
            )}
          </div>
          <p className="text-white/35 text-sm mt-1">
            {isPreview
              ? 'Showing all posts including unpublished drafts'
              : 'Showing published posts only'}
          </p>
        </div>
        <button
          onClick={togglePreview}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer',
            isPreview
              ? 'bg-amber-500/15 border border-amber-500/25 text-amber-300 hover:bg-amber-500/25'
              : 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/25'
          )}
        >
          {isPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {isPreview ? 'Exit Preview' : 'Enter Preview Mode'}
        </button>
      </div>

      {/* Preview mode banner */}
      {isPreview && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="text-amber-300 text-sm">
            <span className="font-semibold">Live Preview active</span>
            {' '}— Drafts are visible. This uses{' '}
            <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded text-xs">
              perspective: &apos;previewDrafts&apos;
            </code>
            {' '}via Directus API.
          </p>
        </div>
      )}

      <div className="bg-[#13141c] border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_140px] px-5 py-2.5 border-b border-white/5">
          {['Post Title', 'Status', 'Featured', 'Published At'].map((col) => (
            <span key={col} className="text-white/25 text-[10px] uppercase tracking-widest font-medium">
              {col}
            </span>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-white/30 text-sm">No posts found</p>
          </div>
        ) : (
          posts.map((post, i) => {
            const isDraft = !post.publishedAt
            return (
              <div
                key={post._id}
                className={cn(
                  'grid grid-cols-[1fr_100px_100px_140px] items-center px-5 py-3.5',
                  i < posts.length - 1 && 'border-b border-white/5',
                  isDraft && isPreview && 'bg-amber-500/5'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isDraft && isPreview && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-300 bg-amber-500/15 rounded shrink-0">
                      Draft
                    </span>
                  )}
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-white/80 text-sm hover:text-white transition-colors truncate"
                  >
                    {post.title}
                  </Link>
                </div>
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  isDraft ? 'text-amber-400' : 'text-emerald-400'
                )}>
                  {isDraft ? 'Draft' : 'Published'}
                </span>
                <span className="text-white/40 text-sm">
                  {post.featured ? '★' : '—'}
                </span>
                <span className="text-white/35 text-xs font-mono">
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), 'MMM dd, yyyy')
                    : '— Unpublished'}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
          {posts.length} posts · {isPreview ? 'draft' : 'published'} perspective
        </p>
        <Link
          href="/posts"
          className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
        >
          ← Back to Posts
        </Link>
      </div>
    </div>
  )
}