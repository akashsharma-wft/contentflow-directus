// features/settings/components/ProfileForm.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import type { Database } from '@/types/supabase'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ProfileAvatar } from './ProfileAvatar'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePostHog } from 'posthog-js/react'

interface SettingsConfig {
  profileSectionLabel?: string
  displayNameLabel?: string
  emailLabel?: string
  emailHelperText?: string
  bioLabel?: string
  bioMaxLength?: number
  websiteLabel?: string
  uploadPhotoLabel?: string
  saveLabel?: string
  discardLabel?: string
  dangerZoneHeading?: string
  dangerZoneBody?: string
  dangerZoneWarning?: string
  deleteAccountLabel?: string
}

interface ProfileFormProps {
  config: SettingsConfig
}

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be under 50 characters'),
  email: z.string().email(),
  bio: z.string().max(200, 'Bio must be under 200 characters').optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileForm({ config }: ProfileFormProps) {
  const supabase = createClient()    // used only for reading the profile
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // formReady gates the skeleton: the form starts with empty defaultValues, and
  // the useEffect below resets it with real profile data. Without this flag, the
  // skeleton would disappear the moment the query returns (profile truthy) but the
  // form fields would still be blank for one paint cycle — showing an empty profile
  // card while the Danger Zone (which uses config props) renders immediately.
  const [formReady, setFormReady] = useState(false)
  const posthog = usePostHog()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', email: '', bio: '', website: '', avatarUrl: '' },
  })

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

  useEffect(() => {
    if (profile && user) {
      form.reset({
        displayName: profile.display_name ?? '',
        email: user.email ?? '',
        bio: profile.bio ?? '',
        website: profile.website ?? '',
        avatarUrl: profile.avatar_url ?? '',
      })
      setFormReady(true)
    }
  }, [profile, user, form])

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: data.displayName,
          bio:          data.bio     || null,
          website:      data.website || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || 'Failed to save profile')
      }
      // Return the updated profile row from the API response so onSuccess can
      // write it directly into the React Query cache without a round-trip SELECT.
      return json as { success: true; profile: ProfileRow }
    },
    onSuccess: (result, data) => {
      // Write the returned profile directly into the cache — avoids a background
      // refetch and the stale-data window that comes with invalidateQueries.
      if (result?.profile) {
        queryClient.setQueryData(['profile', user?.id], result.profile)
      } else {
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      }
      toast.success('Profile saved successfully')
      posthog?.capture('form_submitted', {
        form: 'settings_profile',
        fields_changed: Object.keys(data).filter(k => data[k as keyof ProfileFormData] !== '').length,
      })
    },
    onError: (err: Error) => { toast.error(err.message || 'Failed to save profile') },
  })

  function onSubmit(data: ProfileFormData) { saveProfile(data) }

  function handleDiscard() {
    if (profile && user) {
      form.reset({
        displayName: profile.display_name ?? '',
        email: user.email ?? '',
        bio: profile.bio ?? '',
        website: profile.website ?? '',
        avatarUrl: profile.avatar_url ?? '',
      })
    }
  }

  if (isLoading || !profile || !formReady) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
        {/* Danger Zone skeleton — red border mirrors the actual card */}
        <div className="bg-[#13141c] border border-red-500/10 rounded-2xl p-5 space-y-3 animate-pulse">
          <Skeleton className="h-4 w-24 rounded bg-red-500/10" />
          <Skeleton className="h-3 w-full rounded bg-white/5" />
          <Skeleton className="h-3 w-3/4 rounded bg-white/5" />
          <Skeleton className="h-8 w-32 rounded-lg bg-red-500/10 mt-1" />
        </div>
      </div>
    )
  }

  const bioValue = form.watch('bio') ?? ''
  const displayNameValue = form.watch('displayName') ?? ''
  const displayNameIsValid = displayNameValue.length >= 2 && displayNameValue.length <= 50
  const bioMax = config.bioMaxLength ?? 200

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Avatar */}
          <ProfileAvatar
            avatarUrl={form.watch('avatarUrl') || null}
            displayName={form.watch('displayName')}
            userId={user?.id ?? ''}
            onUploadComplete={(url, updatedProfile) => {
              form.setValue('avatarUrl', url)
              if (updatedProfile) {
                queryClient.setQueryData(['profile', user?.id], updatedProfile as ProfileRow)
              }
            }}
            uploadLabel={config.uploadPhotoLabel}
          />

          {/* Profile fields card */}
          <div className="bg-[#13141c] border border-white/5 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-white text-sm font-semibold">
                  {config.profileSectionLabel ?? 'Profile'}
                </h3>
              </div>
              <span className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
                Metadata ID: CF-9921
              </span>
            </div>

            {/* Display name + Email */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/50 text-xs font-medium">
                      {config.displayNameLabel ?? 'Display name'}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isSaving}
                          className={cn(
                            'bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl pr-9',
                            'focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50',
                            displayNameIsValid && 'border-emerald-500/40'
                          )}
                        />
                        {displayNameIsValid && (
                          <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/50 text-xs font-medium">
                      {config.emailLabel ?? 'Email address'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        disabled
                        className="bg-[#0d0e14] border-white/5 text-white/40 h-10 rounded-xl cursor-not-allowed"
                      />
                    </FormControl>
                    <FormDescription className="text-indigo-400/60 text-[10px] font-mono">
                      {config.emailHelperText ?? 'Managed by Supabase Auth'}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-white/50 text-xs font-medium">
                      {config.bioLabel ?? 'Bio'}
                    </FormLabel>
                    <span className={cn('text-[10px] font-mono', bioValue.length > bioMax - 20 ? 'text-amber-400' : 'text-white/25')}>
                      {bioValue.length} / {bioMax}
                    </span>
                  </div>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      disabled={isSaving}
                      placeholder="Write a short technical bio..."
                      maxLength={bioMax}
                      className="w-full px-3 py-2.5 bg-[#0d0e14] border border-white/10 rounded-xl text-white/70 text-sm placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-colors resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/50 text-xs font-medium">
                    {config.websiteLabel ?? 'Website'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="https://yourwebsite.com"
                      disabled={isSaving}
                      className={cn(
                        'bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl',
                        'focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50',
                        form.formState.errors.website && 'border-red-500/50 focus-visible:border-red-500/50'
                      )}
                    />
                  </FormControl>
                  {form.formState.errors.website && (
                    <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle size={11} />
                      <span>{form.formState.errors.website.message}</span>
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
              >
                {config.discardLabel ?? 'Discard'}
              </button>
              <button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                  'bg-indigo-500 hover:bg-indigo-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSaving ? 'Saving...' : (config.saveLabel ?? 'Save changes')}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#13141c] border border-red-500/20 rounded-2xl p-5 space-y-3">
            <h3 className="text-red-400 text-sm font-semibold">
              {config.dangerZoneHeading ?? 'Danger Zone'}
            </h3>
            <p className="text-white/35 text-xs leading-relaxed">
              {config.dangerZoneBody ?? 'Permanently delete your account and all associated architectural data. This action cannot be undone.'}
            </p>
            <p className="text-red-400/50 text-[10px] uppercase tracking-widest font-mono">
              {config.dangerZoneWarning ?? 'Warning: All API keys will be invalidated.'}
            </p>
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-all cursor-pointer"
            >
              {config.deleteAccountLabel ?? 'Delete Account'}
            </button>
          </div>
        </form>
      </Form>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={user?.email ?? ''}
      />
    </>
  )
}