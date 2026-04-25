'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { UsageCard } from '@/features/billing/components/UsageCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionBillingUsageContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttrs } from '@/lib/directus/section-binding'

interface Props {
  content: SectionBillingUsageContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function BillingUsageSection({ content, translationId, translationRow }: Props) {
  const { user } = useUser()
  const supabase = createClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  })

  const { data: postStats } = useQuery({
    queryKey: ['my-post-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, published: 0 }
      const res = await fetch('/api/posts')
      if (!res.ok) return { total: 0, published: 0 }
      const posts = (await res.json()) as { publishedAt: string | null }[]
      return {
        total:     posts.length,
        published: posts.filter(p => !!p.publishedAt).length,
      }
    },
    enabled: !!user?.id,
  })

  const isPro = (profile?.subscription_tier as string) === 'pro'

  const postsUsageLabel   = translationRow?.billing_posts_label    ?? content.postsUsageLabel   ?? 'Posts Published'
  const apiUsageLabel     = translationRow?.billing_api_label      ?? content.apiUsageLabel     ?? 'API Requests'
  const storageUsageLabel = translationRow?.billing_storage_label  ?? content.storageUsageLabel ?? 'Storage Utilization'
  const seatsUsageLabel   = translationRow?.billing_seats_label    ?? content.seatsUsageLabel   ?? 'Team Seats'
  const usageHeading      = translationRow?.billing_usage_heading  ?? content.usageHeading

  const usageItems = [
    { label: postsUsageLabel,   current: postStats?.published ?? 0, max: isPro ? 999999 : 5 },
    { label: apiUsageLabel,     current: 0, max: isPro ? 10000 : 1000 },
    { label: storageUsageLabel, current: 0, max: isPro ? 5 : 1, unit: 'GB' as const },
    { label: seatsUsageLabel,   current: 1, max: isPro ? 5 : 1 },
  ]

  if (isLoading) {
    return <div className="mb-5"><Skeleton className="h-48 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div
      className="mb-5"
      data-directus={pageAttrs(translationId,
        'billing_usage_heading', 'billing_posts_label', 'billing_api_label',
        'billing_storage_label', 'billing_seats_label'
      )}
    >
      <UsageCard
        items={usageItems}
        heading={usageHeading}
      />
    </div>
  )
}