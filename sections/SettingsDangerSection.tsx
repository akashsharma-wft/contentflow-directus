// sections/SettingsDangerSection.tsx
//
// Client component — renders the danger zone card for /settings.
// Receives CMS labels from the `settingsDanger` CMS section config.

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { DeleteAccountDialog } from '@/features/settings/components/DeleteAccountDialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionSettingsDangerContent } from '@/types/cms'

interface Props {
  content: SectionSettingsDangerContent
}

export function SettingsDangerSection({ content }: Props) {
  const { user, isLoading: isAuthLoading } = useUser()
  const supabase = createClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="mt-5 bg-[#13141c] border border-red-500/10 rounded-2xl p-5 space-y-3 animate-pulse">
        <Skeleton className="h-4 w-24 rounded bg-red-500/10" />
        <Skeleton className="h-3 w-full rounded bg-white/5" />
        <Skeleton className="h-3 w-3/4 rounded bg-white/5" />
        <Skeleton className="h-8 w-32 rounded-lg bg-red-500/10 mt-1" />
      </div>
    )
  }

  return (
    <>
      <div className="bg-[#13141c] border border-red-500/20 rounded-2xl p-5 space-y-3">
        <h3 className="text-red-400 text-sm font-semibold">
          {content.heading ?? 'Danger Zone'}
        </h3>
        <p className="text-white/35 text-xs leading-relaxed">
          {content.body ?? 'Permanently delete your account and all associated architectural data. This action cannot be undone.'}
        </p>
        <p className="text-red-400/50 text-[10px] uppercase tracking-widest font-mono">
          {content.warningText ?? 'Warning: All API keys will be invalidated.'}
        </p>
        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-all cursor-pointer"
        >
          {content.deleteLabel ?? 'Delete Account'}
        </button>
      </div>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={user?.email ?? ''}
      />
    </>
  )
}
