// sections/BillingFooterSection.tsx
import { Shield } from 'lucide-react'
import type { SectionBillingFooterContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionBillingFooterContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function BillingFooterSection({ content, translationId, translationRow }: Props) {
  const stripeNote  = translationRow?.billing_stripe_note  ?? content.stripeNote  ?? 'Billing Portal Powered by Stripe'
  const webhookNote = translationRow?.billing_webhook_note ?? content.webhookNote ?? 'Webhook: /api/webhooks/stripe'

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#13141c] border border-white/5 rounded-xl flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Shield size={12} className="text-indigo-400" />
        <span
          data-directus={pageAttr(translationId, 'billing_stripe_note')}
          className="text-white/30 text-[10px] uppercase tracking-widest font-mono"
        >
          {stripeNote}
        </span>
      </div>
      <span
        data-directus={pageAttr(translationId, 'billing_webhook_note')}
        className="text-white/20 text-[10px] font-mono"
      >
        {webhookNote}
      </span>
    </div>
  )
}