// features/billing/components/BillingPageClient.tsx
'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { CurrentPlanCard } from './CurrentPlanCard'
import { UsageCard } from './UsageCard'
import { PlansGrid } from './PlansGrid'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { usePostHog } from 'posthog-js/react'
import { Shield } from 'lucide-react'

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!

interface BillingConfig {
  heading?: string
  subheading?: string
  currentPlanLabel?: string
  manageLabel?: string
  cancelLabel?: string
  reactivateLabel?: string
  upgradeLabel?: string
  usageHeading?: string
  postsUsageLabel?: string
  apiUsageLabel?: string
  storageUsageLabel?: string
  seatsUsageLabel?: string
  plansHeading?: string
  freePlanName?: string
  freePlanTagline?: string
  freePlanPrice?: string
  freePlanFeatures?: string[]
  proPlanName?: string
  proPlanTagline?: string
  proPlanBadge?: string
  proPlanFeatures?: string[]
  downgradeLabel?: string
  currentPlanButtonLabel?: string
}

interface BillingPageClientProps {
  config: BillingConfig
}

function BillingContent({ config }: BillingPageClientProps) {
  const router = useRouter()
  const posthog = usePostHog()
  // ctxProfile: the profile already fetched by AuthProvider (used for display).
  // It hydrates async after getSession(), so it may be null on first render.
  const { user, profile: ctxProfile } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  const { data: queryProfile, isLoading: isQueryLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, display_name, email, subscription_cancel_at')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  })

  // Use query data if available; fall back to AuthContext profile while query loads.
  // This prevents the Free→Pro flash: ctxProfile has the real tier from the shared
  // AuthProvider fetch, so we never default to 'free' once auth is resolved.
  const profile = queryProfile ?? (ctxProfile
    ? {
        subscription_tier: ctxProfile.subscription_tier,
        display_name: ctxProfile.display_name,
        email: ctxProfile.email,
        subscription_cancel_at: ctxProfile.subscription_cancel_at ?? null,
      }
    : null)

  // Show skeleton until we have real profile data from ANY source.
  // React Query v5 reports isLoading:false when enabled:false (query disabled because
  // user is null), so we must also gate on !profile to cover that case.
  const isLoading = isQueryLoading || !profile

  const currentTier = (profile?.subscription_tier as 'free' | 'pro') ?? 'free'
  const isPro = currentTier === 'pro'
  const isCancelling = !!profile?.subscription_cancel_at
  const cancelAt = profile?.subscription_cancel_at
    ? new Date(profile.subscription_cancel_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      })
    : null

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

  const usageItems = [
    { label: config.postsUsageLabel ?? 'Posts Published', current: postStats?.published ?? 0, max: isPro ? 999999 : 5 },
    { label: config.apiUsageLabel ?? 'API Requests', current: 0, max: isPro ? 10000 : 1000 },
    { label: config.storageUsageLabel ?? 'Storage Utilization', current: 0, max: isPro ? 5 : 1, unit: 'GB' as const },
    { label: config.seatsUsageLabel ?? 'Team Seats', current: 1, max: isPro ? 5 : 1 },
  ]

  async function handleUpgrade() {
    if (!PRO_PRICE_ID) { toast.error('Stripe not configured'); return }
    posthog?.capture('upgrade_intent', { plan: 'pro', user_id: user?.id, source: 'billing_page' })
    setIsCheckoutLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRO_PRICE_ID }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session')
      if (data.url) router.push(data.url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setIsCheckoutLoading(false)
    }
  }

  async function handleDowngrade() {
    try {
      const response = await fetch('/api/stripe/cancel', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toast.success('Subscription set to cancel at period end')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Downgrade failed')
    }
  }

  return (
    <div className="py-6 space-y-5 max-w-[800px] mx-auto">
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">
          {config.heading ?? 'Billing & Plans'}
        </h1>
        <p className="text-white/35 text-sm mt-1">
          {config.subheading ?? 'Manage your subscription, view usage metrics, and upgrade your workspace.'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
        </div>
      ) : (
        <>
          <CurrentPlanCard
            tier={currentTier}
            isCancelling={isCancelling}
            cancelAt={cancelAt}
            onUpgrade={handleUpgrade}
            isLoading={isCheckoutLoading}
            currentPlanLabel={config.currentPlanLabel}
            manageLabel={config.manageLabel}
            cancelLabel={config.cancelLabel}
            reactivateLabel={config.reactivateLabel}
            upgradeLabel={config.upgradeLabel}
          />
          <UsageCard
            items={usageItems}
            heading={config.usageHeading}
          />
          <PlansGrid
            currentTier={currentTier}
            proPriceId={PRO_PRICE_ID}
            onUpgrade={handleUpgrade}
            onDowngrade={handleDowngrade}
            isLoading={isCheckoutLoading}
            isCancelling={isCancelling}
            config={config}
          />
        </>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-[#13141c] border border-white/5 rounded-xl flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-indigo-400" />
          <span className="text-white/30 text-[10px] uppercase tracking-widest font-mono">
            Billing Portal Powered by Stripe
          </span>
        </div>
        <span className="text-white/20 text-[10px] font-mono">Webhook: /api/webhooks/stripe</span>
      </div>
    </div>
  )
}

export function BillingPageClient({ config }: BillingPageClientProps) {
  return (
    <Suspense fallback={
      <div className="py-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-white/5 rounded" />
        <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
      </div>
    }>
      <BillingContent config={config} />
    </Suspense>
  )
}