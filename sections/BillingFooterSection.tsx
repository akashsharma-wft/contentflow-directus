// sections/BillingFooterSection.tsx
//
// Server component — renders the Stripe/webhook note row at the bottom of /billing.
// Receives CMS content from the `billingFooter` CMS section config.

import { Shield } from 'lucide-react'
import type { SectionBillingFooterContent } from '@/types/cms'

interface Props {
  content: SectionBillingFooterContent
}

export function BillingFooterSection({ content }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#13141c] border border-white/5 rounded-xl flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Shield size={12} className="text-indigo-400" />
        <span className="text-white/30 text-[10px] uppercase tracking-widest font-mono">
          {content.stripeNote ?? 'Billing Portal Powered by Stripe'}
        </span>
      </div>
      <span className="text-white/20 text-[10px] font-mono">
        {content.webhookNote ?? 'Webhook: /api/webhooks/stripe'}
      </span>
    </div>
  )
}
