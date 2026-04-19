// sections/PostsActionsSection.tsx
//
// Client component — renders the Sync and New Post action buttons for /posts.
// Sync invalidates the shared ['posts-all'] React Query key so all sections refresh.
// CreatePostModal is mounted here so the New Post button works correctly.

'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CreatePostModal } from '@/features/posts/components/CreatePostModal'
import type { SectionPostsActionsContent } from '@/types/cms'

interface Props {
  content: SectionPostsActionsContent
  lang?: string
}

export function PostsActionsSection({ content, lang = 'en' }: Props) {
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing]   = useState(false)
  const [modalOpen, setModalOpen]   = useState(false)

  async function handleSync() {
    setIsSyncing(true)
    try {
      // ['posts'] prefix matches both ['posts','all',lang] and ['posts','stats',lang].
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Posts refreshed')
    } catch {
      toast.error('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : (content.syncButtonLabel ?? 'Sync')}
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={13} />
          {content.newPostButtonLabel ?? 'New Post'}
        </button>
      </div>

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} lang={lang} />
    </>
  )
}
