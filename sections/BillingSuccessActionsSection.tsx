// sections/BillingSuccessActionsSection.tsx
//
// Server component — renders the CTA buttons for /billing-success.
// Primary and secondary button labels and hrefs are fully configurable
// from the `billingSuccessActions` CMS section config.

import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'
import type { SectionBillingSuccessActionsContent } from '@/types/cms'

interface Props {
  content: SectionBillingSuccessActionsContent
}

export function BillingSuccessActionsSection({ content }: Props) {
  const primaryLabel   = content.primaryLabel   ?? 'Go to Posts'
  const primaryHref    = content.primaryHref    ?? '/posts'
  const secondaryLabel = content.secondaryLabel ?? 'Manage Subscription'
  const secondaryHref  = content.secondaryHref  ?? '/billing'

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap pb-10 px-4">
      <Link
        href={primaryHref}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {primaryLabel}
        <ArrowRight size={15} />
      </Link>
      <Link
        href={secondaryHref}
        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <CreditCard size={15} />
        {secondaryLabel}
      </Link>
    </div>
  )
}
