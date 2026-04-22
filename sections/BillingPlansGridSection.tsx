// sections/BillingPlansGridSection.tsx
//
// Client component — renders the plans comparison grid for /billing.
// Receives CMS labels from the `billingPlansGrid` CMS section config.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { PlansGrid } from '@/features/billing/components/PlansGrid'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { usePostHog } from 'posthog-js/react'
import type { SectionBillingPlansGridContent } from '@/types/cms'

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!

interface Props {
  content: SectionBillingPlansGridContent
  lang?: string
}

export function BillingPlansGridSection({ content, lang = 'en' }: Props) {
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

  async function handleUpgrade() {
    if (!PRO_PRICE_ID) { toast.error('Stripe not configured'); return }
    posthog?.capture('upgrade_intent', { plan: 'pro', user_id: user?.id, source: 'billing_plans_grid' })
    setIsCheckoutLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRO_PRICE_ID, lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      if (data.url) router.push(data.url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setIsCheckoutLoading(false)
    }
  }

  async function handleDowngrade() {
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toast.success('Subscription set to cancel at period end')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Downgrade failed')
    }
  }

  if (isLoading) {
    return <div className="mb-5"><Skeleton className="h-64 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div className="mb-5">
      <PlansGrid
        currentTier={currentTier}
        proPriceId={PRO_PRICE_ID}
        onUpgrade={handleUpgrade}
        onDowngrade={handleDowngrade}
        isLoading={isCheckoutLoading}
        isCancelling={isCancelling}
        config={content}
      />
    </div>
  )
}
