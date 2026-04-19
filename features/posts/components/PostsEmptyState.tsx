// features/posts/components/PostsEmptyState.tsx
import { RefreshCw, FolderOpen } from 'lucide-react'

interface PostsEmptyStateProps {
  title?: string
  body?: string
  ctaLabel?: string
  onSync?: () => void
  isSyncing?: boolean
}

export function PostsEmptyState({
  title = 'No posts found',
  body = 'Try adjusting your search or refresh to populate your workspace.',
  ctaLabel = 'Refresh',
  onSync,
  isSyncing = false,
}: PostsEmptyStateProps) {
  return (
    <div className="bg-[#13141c] border border-white/5 rounded-2xl p-8">
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <FolderOpen size={24} className="text-white/20" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-white/60 text-sm font-medium">{title}</p>
          <p className="text-white/25 text-xs max-w-xs leading-relaxed">{body}</p>
        </div>
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/50 hover:text-white text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : ctaLabel}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-white/20 text-[9px] font-mono uppercase tracking-widest">
          Directus API Connected
        </span>
        <span className="text-white/20 text-[9px] font-mono uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
          IDLE_WORKSPACE
        </span>
      </div>
    </div>
  )
}