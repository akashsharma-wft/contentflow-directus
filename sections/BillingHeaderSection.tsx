// sections/BillingHeaderSection.tsx
import type { SectionBillingHeaderContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content:        SectionBillingHeaderContent
  translationId?: number
  translationRow?: DirectusPageTranslationRow
}

export function BillingHeaderSection({ content, translationId, translationRow }: Props) {
  const heading    = translationRow?.billing_heading    ?? content.heading    ?? 'Billing & Plans'
  const subheading = translationRow?.billing_subheading ?? content.subheading ?? 'Manage your subscription, view usage metrics, and upgrade your workspace.'

  return (
    <div className="mb-5">
      <h1
        data-directus={pageAttr(translationId, 'billing_heading')}
        className="text-white text-2xl font-bold tracking-tight"
      >
        {heading}
      </h1>
      <p
        data-directus={pageAttr(translationId, 'billing_subheading')}
        className="text-white/35 text-sm mt-1"
      >
        {subheading}
      </p>
    </div>
  )
}