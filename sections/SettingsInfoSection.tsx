'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { ProfileAvatar } from '@/features/settings/components/ProfileAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionSettingsInfoContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionSettingsInfoContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function SettingsInfoSection({ content, translationId, translationRow }: Props) {
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
      return data
    },
    enabled: !!user?.id,
  })

  const uploadLabel = translationRow?.settings_upload_photo_label ?? content.uploadPhotoLabel

  if (isAuthLoading || isLoading) {
    return <div className="mb-5"><Skeleton className="h-24 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div
      className="mb-5"
      data-directus={pageAttr(translationId, 'settings_upload_photo_label')}
    >
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
        uploadLabel={uploadLabel}
      />
    </div>
  )
}