// sections/BillingCurrentPlanSection.tsx
//
// Client component — renders the current plan card for /billing.
// Receives CMS labels from the `billingCurrentPlan` CMS section config
// and manages its own profile query + upgrade/manage handlers.

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

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!

interface Props {
  content: SectionBillingCurrentPlanContent
}

export function BillingCurrentPlanSection({ content }: Props) {
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

  if (isLoading) {
    return <div className="mb-5"><Skeleton className="h-24 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div className="mb-5">
      <CurrentPlanCard
        tier={currentTier}
        isCancelling={isCancelling}
        cancelAt={cancelAt}
        onUpgrade={handleUpgrade}
        isLoading={isCheckoutLoading}
        currentPlanLabel={content.currentPlanLabel}
        manageLabel={content.manageLabel}
        cancelLabel={content.cancelLabel}
        reactivateLabel={content.reactivateLabel}
        upgradeLabel={content.upgradeLabel}
        activeBadgeLabel={content.activeBadgeLabel}
        cancellingBadgeLabel={content.cancellingBadgeLabel}
        freeTierBadgeLabel={content.freeTierBadgeLabel}
        cancellingNote={content.cancellingNote}
      />
    </div>
  )
}
