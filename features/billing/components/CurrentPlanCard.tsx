// features/billing/components/CurrentPlanCard.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CancelSubscriptionDialog } from './CancelSubscriptionDialog'

interface CurrentPlanCardProps {
  tier: 'free' | 'pro'
  isCancelling?: boolean
  cancelAt?: string | null
  onUpgrade: () => void
  isLoading: boolean
  currentPlanLabel?: string
  manageLabel?: string
  cancelLabel?: string
  reactivateLabel?: string
  upgradeLabel?: string
  activeBadgeLabel?: string
  cancellingBadgeLabel?: string
  freeTierBadgeLabel?: string
  cancellingNote?: string
}

export function CurrentPlanCard({
  tier, isCancelling, cancelAt, onUpgrade, isLoading,
  currentPlanLabel = 'Current Plan',
  manageLabel = 'Manage subscription',
  cancelLabel = 'Cancel',
  reactivateLabel = 'Reactivate',
  upgradeLabel = 'Upgrade to Pro',
  activeBadgeLabel = 'Active',
  cancellingBadgeLabel = 'Cancelling',
  freeTierBadgeLabel = 'Free Tier',
  cancellingNote,
}: CurrentPlanCardProps) {
  const isPro = tier === 'pro'
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  async function handleManageSubscription() {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.info('Configure your Stripe Customer Portal in the Stripe dashboard first')
      }
    } catch {
      toast.error('Failed to open billing portal')
    }
  }

  async function handleCancelConfirm() {
    const response = await fetch('/api/stripe/cancel', { method: 'POST' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    toast.success('Subscription cancelled. You keep Pro access until the billing period ends.')
  }

  return (
    <>
      <div className="bg-[#13141c] border border-white/5 rounded-2xl p-5">
        <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-3">
          {currentPlanLabel}
        </p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-2xl font-bold">{isPro ? 'Pro' : 'Free'}</h2>
            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${
              isCancelling
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : isPro
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-white/40 bg-white/5 border-white/10'
            }`}>
              {isCancelling ? cancellingBadgeLabel : isPro ? activeBadgeLabel : freeTierBadgeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPro ? (
              <>
                <button
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? reactivateLabel : manageLabel}
                </button>
                {!isCancelling && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onUpgrade}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : upgradeLabel}
              </button>
            )}
          </div>
        </div>

        {isCancelling && cancelAt && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-amber-500/8 border border-amber-500/15 rounded-xl">
            <span className="text-amber-400 text-xs mt-0.5">⚠</span>
            <p className="text-amber-300/80 text-xs leading-relaxed">
              {cancellingNote
                ? cancellingNote
                : <>Your Pro access continues until{' '}
                    <span className="font-semibold text-amber-300">{cancelAt}</span>.
                    After that, your account reverts to Free. Click{' '}
                    <span className="font-semibold">Reactivate</span> to continue Pro.
                  </>
              }
            </p>
          </div>
        )}
      </div>

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
      />
    </>
  )
}