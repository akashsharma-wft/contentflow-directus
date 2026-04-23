// sections/BillingSuccessActionsSection.tsx
import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'
import type { SectionBillingSuccessActionsContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionBillingSuccessActionsContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function BillingSuccessActionsSection({ content, translationId, translationRow }: Props) {
  const primaryLabel   = translationRow?.billing_success_primary_label   ?? content.primaryLabel   ?? 'Go to Posts'
  const primaryHref    = translationRow?.billing_success_primary_href    ?? content.primaryHref    ?? '/posts'
  const secondaryLabel = translationRow?.billing_success_secondary_label ?? content.secondaryLabel ?? 'Manage Subscription'
  const secondaryHref  = translationRow?.billing_success_secondary_href  ?? content.secondaryHref  ?? '/billing'

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap pb-10 px-4">
      <Link
        href={primaryHref}
        data-directus={pageAttr(translationId, 'billing_success_primary_label,billing_success_primary_href')}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {primaryLabel}
        <ArrowRight size={15} />
      </Link>
      <Link
        href={secondaryHref}
        data-directus={pageAttr(translationId, 'billing_success_secondary_label,billing_success_secondary_href')}
        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <CreditCard size={15} />
        {secondaryLabel}
      </Link>
    </div>
  )
}