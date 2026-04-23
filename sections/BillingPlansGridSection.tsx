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
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!

interface Props {
  content: SectionBillingPlansGridContent
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function BillingPlansGridSection({ content, lang = 'en', translationId, translationRow }: Props) {
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

  // Merge translationRow fields over content blob
  const resolvedContent: SectionBillingPlansGridContent = {
    ...content,
    plansHeading:       translationRow?.billing_plans_heading   ?? content.plansHeading,
    freePlanName:       translationRow?.billing_free_name       ?? content.freePlanName,
    freePlanTagline:    translationRow?.billing_free_tagline    ?? content.freePlanTagline,
    freePlanPrice:      translationRow?.billing_free_price      ?? content.freePlanPrice,
    freePlanFeatures:   (translationRow?.billing_free_features  as string[] | undefined) ?? content.freePlanFeatures,
    proPlanName:        translationRow?.billing_pro_name        ?? content.proPlanName,
    proPlanTagline:     translationRow?.billing_pro_tagline     ?? content.proPlanTagline,
    proPlanBadge:       translationRow?.billing_pro_badge       ?? content.proPlanBadge,
    proPlanFeatures:    (translationRow?.billing_pro_features   as string[] | undefined) ?? content.proPlanFeatures,
    upgradeCta:         translationRow?.billing_upgrade_cta     ?? content.upgradeCta,
    downgradeCta:       translationRow?.billing_downgrade_cta   ?? content.downgradeCta,
    currentPlanBtn:     translationRow?.billing_current_plan_btn ?? content.currentPlanBtn,
  }

  if (isLoading) {
    return <div className="mb-5"><Skeleton className="h-64 w-full rounded-2xl bg-white/5" /></div>
  }

  return (
    <div
      className="mb-5"
      data-directus={pageAttr(translationId, 'billing_plans_heading')}
    >
      <PlansGrid
        currentTier={currentTier}
        proPriceId={PRO_PRICE_ID}
        onUpgrade={handleUpgrade}
        onDowngrade={handleDowngrade}
        isLoading={isCheckoutLoading}
        isCancelling={isCancelling}
        config={resolvedContent}
      />
    </div>
  )
}