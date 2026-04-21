// sections/SettingsInfoSection.tsx
//
// Client component — renders the profile avatar / photo card for /settings.
// ProfileAvatar auto-saves avatar_url directly to Supabase, so it is fully
// detached from the profile form below it.
// Receives CMS labels from the `settingsInfo` CMS section config.

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { ProfileAvatar } from '@/features/settings/components/ProfileAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionSettingsInfoContent } from '@/types/cms'

interface Props {
  content: SectionSettingsInfoContent
}

export function SettingsInfoSection({ content }: Props) {
  const { user, isLoading: isAuthLoading } = useUser()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      console.log('[SettingsInfoSection] query fetched:', data)
      return data
    },
    enabled: !!user?.id,
  })

  if (isAuthLoading || isLoading) {
    return <div className="mb-5"><Skeleton className="h-24 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div className="mb-5">
      <ProfileAvatar
        avatarUrl={profile?.avatar_url ?? null}
        displayName={profile?.display_name ?? null}
        userId={user?.id ?? ''}
        onUploadComplete={(_url, updatedProfile) => {
          if (updatedProfile) {
            queryClient.setQueryData(['profile', user?.id], updatedProfile)
          } else {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
          }
        }}
        uploadLabel={content.uploadPhotoLabel}
      />
    </div>
  )
}
