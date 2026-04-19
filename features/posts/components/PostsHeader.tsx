'use client'

import { RefreshCw, Plus } from 'lucide-react'
import { useState } from 'react'
import { CreatePostModal } from './CreatePostModal'

interface PostsHeaderProps {
  heading?: string
  subheading?: string
  apiBadgeLabel?: string
  syncButtonLabel?: string
  newPostButtonLabel?: string
  onSync: () => Promise<unknown>
  isSyncing: boolean
}

export function PostsHeader({
  heading = 'Blog Posts',
  subheading = 'Manage your technical documentation and editorial content.',
  apiBadgeLabel = 'via Directus',
  syncButtonLabel = 'Sync',
  newPostButtonLabel = '+ New Post',
  onSync,
  isSyncing,
}: PostsHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="w-full flex items-start justify-between gap-5 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-white text-2xl font-bold tracking-tight">{heading}</h1>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              {apiBadgeLabel}
            </span>
          </div>
          <p className="text-white/35 text-sm">
            {subheading}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : syncButtonLabel}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={13} />
            {newPostButtonLabel}
          </button>
        </div>
      </div>
      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}