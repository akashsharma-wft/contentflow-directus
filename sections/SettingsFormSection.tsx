'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
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
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePostHog } from 'posthog-js/react'
import type { SectionSettingsFormContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionSettingsFormContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be under 50 characters'),
  email:       z.string().email(),
  bio:         z.string().max(500, 'Bio too long').optional().or(z.literal('')),
  website:     z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function SettingsFormSection({ content, translationId, translationRow }: Props) {
  const queryClient = useQueryClient()
  const { user, isLoading: isAuthLoading } = useUser()
  const posthog = usePostHog()
  const bioMax = content.bioMaxLength ?? 200
  const supabase = createClient()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', email: '', bio: '', website: '' },
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
        email:       user.email ?? '',
        bio:         profile.bio ?? '',
        website:     profile.website ?? '',
      })
    }
  }, [profile, user, form])

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await fetch('/api/profile', {
        method:  'PATCH',
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
      return json as { success: true; profile: { display_name: string | null; bio: string | null; website: string | null } }
    },
    onSuccess: (result, data) => {
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

  function handleDiscard() {
    if (profile && user) {
      form.reset({
        displayName: profile.display_name ?? '',
        email:       user.email ?? '',
        bio:         profile.bio ?? '',
        website:     profile.website ?? '',
      })
    }
  }

  if (isAuthLoading || isLoading) {
    return (
      <div
        className="mb-5"
        data-directus={pageAttr(translationId, 'settings_display_name_label')}
      >
        <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
      </div>
    )
  }

  const bioValue         = form.watch('bio') ?? ''
  const displayNameValue = form.watch('displayName') ?? ''
  const displayNameValid = displayNameValue.length >= 2 && displayNameValue.length <= 50

  // Resolve all labels: translationRow > content > hardcoded default
  const displayNameLabel  = translationRow?.settings_display_name_label ?? content.displayNameLabel  ?? 'Display name'
  const emailLabel        = translationRow?.settings_email_label         ?? content.emailLabel        ?? 'Email address'
  const emailHelperText   = translationRow?.settings_email_helper        ?? content.emailHelperText   ?? 'Managed by Supabase Auth'
  const bioLabel          = translationRow?.settings_bio_label           ?? content.bioLabel          ?? 'Bio'
  const bioPlaceholder    = translationRow?.settings_bio_placeholder     ?? content.bioPlaceholder    ?? 'Write a short technical bio...'
  const websiteLabel      = translationRow?.settings_website_label       ?? content.websiteLabel      ?? 'Website'
  const websitePlaceholder = translationRow?.settings_website_placeholder ?? content.websitePlaceholder ?? 'https://yourwebsite.com'
  const websiteErrorText  = translationRow?.settings_website_error       ?? content.websiteErrorText
  const discardLabel      = translationRow?.settings_discard_label       ?? content.discardLabel      ?? 'Discard'
  const saveLabel         = translationRow?.settings_save_label          ?? content.saveLabel         ?? 'Save changes'

  return (
    <div className="mb-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => saveProfile(d))}>
          <div className="bg-[#13141c] border border-white/5 rounded-2xl p-5 space-y-5">

            {/* Card header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-white text-sm font-semibold">
                  {content.profileSectionLabel ?? 'Profile'}
                </h3>
              </div>
              <span className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
                {content.metadataLabel ?? 'Metadata ID: CF-9921'}
              </span>
            </div>

            {/* Display name + Email */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      data-directus={pageAttr(translationId, 'settings_display_name_label')}
                      className="text-white/50 text-xs font-medium"
                    >
                      {displayNameLabel}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isSaving}
                          className={cn(
                            'bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl pr-9',
                            'focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50',
                            displayNameValid && 'border-emerald-500/40',
                          )}
                        />
                        {displayNameValid && (
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
                    <FormLabel
                      data-directus={pageAttr(translationId, 'settings_email_label')}
                      className="text-white/50 text-xs font-medium"
                    >
                      {emailLabel}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        disabled
                        className="bg-[#0d0e14] border-white/5 text-white/40 h-10 rounded-xl cursor-not-allowed"
                      />
                    </FormControl>
                    <FormDescription
                      data-directus={pageAttr(translationId, 'settings_email_helper')}
                      className="text-indigo-400/60 text-[10px] font-mono"
                    >
                      {emailHelperText}
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
                    <FormLabel
                      data-directus={pageAttr(translationId, 'settings_bio_label')}
                      className="text-white/50 text-xs font-medium"
                    >
                      {bioLabel}
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
                      placeholder={bioPlaceholder}
                      maxLength={bioMax}
                      data-directus={pageAttr(translationId, 'settings_bio_placeholder')}
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
                  <FormLabel
                    data-directus={pageAttr(translationId, 'settings_website_label')}
                    className="text-white/50 text-xs font-medium"
                  >
                    {websiteLabel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder={websitePlaceholder}
                      disabled={isSaving}
                      className={cn(
                        'bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl',
                        'focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50',
                        form.formState.errors.website && 'border-red-500/50 focus-visible:border-red-500/50',
                      )}
                    />
                  </FormControl>
                  {form.formState.errors.website && (
                    <p
                      data-directus={pageAttr(translationId, 'settings_website_error')}
                      className="text-red-400 text-xs flex items-center gap-1 mt-1"
                    >
                      <AlertTriangle size={11} />
                      <span>{websiteErrorText ?? form.formState.errors.website.message}</span>
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
                data-directus={pageAttr(translationId, 'settings_discard_label')}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
              >
                {discardLabel}
              </button>
              <button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                data-directus={pageAttr(translationId, 'settings_save_label')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                  'bg-indigo-500 hover:bg-indigo-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {isSaving ? 'Saving...' : saveLabel}
              </button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}