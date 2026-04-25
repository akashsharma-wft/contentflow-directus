'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { CurrentPlanCard } from '@/features/billing/components/CurrentPlanCard'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { usePostHog } from 'posthog-js/react'
import type { SectionBillingCurrentPlanContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttrs } from '@/lib/directus/section-binding'

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!

interface Props {
  content: SectionBillingCurrentPlanContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function BillingCurrentPlanSection({ content, translationId, translationRow }: Props) {
  const router = useRouter()
  const posthog = usePostHog()
  const { user } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_cancel_at')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  })

  const currentTier = (profile?.subscription_tier as 'free' | 'pro') ?? 'free'
  const isCancelling = !!profile?.subscription_cancel_at
  const cancelAt = profile?.subscription_cancel_at
    ? new Date(profile.subscription_cancel_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  async function handleUpgrade() {
    if (!PRO_PRICE_ID) { toast.error('Stripe not configured'); return }
    posthog?.capture('upgrade_intent', { plan: 'pro', user_id: user?.id, source: 'billing_page' })
    setIsCheckoutLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRO_PRICE_ID }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      if (data.url) router.push(data.url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setIsCheckoutLoading(false)
    }
  }

  // Resolve labels: translationRow fields take priority, fall back to content blob, then hardcoded default
  const currentPlanLabel      = translationRow?.billing_current_plan_label   ?? content.currentPlanLabel
  const manageLabel           = translationRow?.billing_manage_label          ?? content.manageLabel
  const cancelLabel           = translationRow?.billing_cancel_label          ?? content.cancelLabel
  const reactivateLabel       = translationRow?.billing_reactivate_label      ?? content.reactivateLabel
  const upgradeLabel          = translationRow?.billing_upgrade_label         ?? content.upgradeLabel
  const activeBadgeLabel      = translationRow?.billing_active_badge          ?? content.activeBadgeLabel
  const cancellingBadgeLabel  = translationRow?.billing_cancelling_badge      ?? content.cancellingBadgeLabel
  const freeTierBadgeLabel    = translationRow?.billing_free_badge            ?? content.freeTierBadgeLabel
  const cancellingNote        = translationRow?.billing_cancelling_note       ?? content.cancellingNote

  if (isLoading) {
    return <div className="mb-5"><Skeleton className="h-24 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div
      className="mb-5"
      data-directus={pageAttrs(translationId,
        'billing_current_plan_label', 'billing_active_badge', 'billing_cancelling_badge',
        'billing_free_badge', 'billing_manage_label', 'billing_cancel_label',
        'billing_reactivate_label', 'billing_upgrade_label', 'billing_cancelling_note'
      )}
    >
      <CurrentPlanCard
        tier={currentTier}
        isCancelling={isCancelling}
        cancelAt={cancelAt}
        onUpgrade={handleUpgrade}
        isLoading={isCheckoutLoading}
        currentPlanLabel={currentPlanLabel}
        manageLabel={manageLabel}
        cancelLabel={cancelLabel}
        reactivateLabel={reactivateLabel}
        upgradeLabel={upgradeLabel}
        activeBadgeLabel={activeBadgeLabel}
        cancellingBadgeLabel={cancellingBadgeLabel}
        freeTierBadgeLabel={freeTierBadgeLabel}
        cancellingNote={cancellingNote}
      />
    </div>
  )
}