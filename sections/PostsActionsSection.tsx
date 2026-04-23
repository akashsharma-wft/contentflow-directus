'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CreatePostModal } from '@/features/posts/components/CreatePostModal'
import type { SectionPostsActionsContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionPostsActionsContent
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function PostsActionsSection({ content, lang = 'en', translationId, translationRow }: Props) {
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing]   = useState(false)
  const [modalOpen, setModalOpen]   = useState(false)

  const syncLabel    = translationRow?.posts_sync_label ?? content.syncButtonLabel  ?? 'Sync'
  const newPostLabel = translationRow?.posts_new_label  ?? content.newPostButtonLabel ?? 'New Post'

  async function handleSync() {
    setIsSyncing(true)
    try {
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
          data-directus={pageAttr(translationId, 'posts_sync_label')}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : syncLabel}
        </button>
        <button
          onClick={() => setModalOpen(true)}
          data-directus={pageAttr(translationId, 'posts_new_label')}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={13} />
          {newPostLabel}
        </button>
      </div>

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} lang={lang} />
    </>
  )
}