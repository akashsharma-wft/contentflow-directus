// sections/BillingHeaderSection.tsx
//
// Server component — renders the heading + subheading for /billing.
// Receives content from the `billingHeader` CMS section config.

import type { SectionBillingHeaderContent } from '@/types/cms'

interface Props {
  content: SectionBillingHeaderContent
}

export function BillingHeaderSection({ content }: Props) {
  return (
    <div className="mb-5">
      <h1 className="text-white text-2xl font-bold tracking-tight">
        {content.heading ?? 'Billing & Plans'}
      </h1>
      <p className="text-white/35 text-sm mt-1">
        {content.subheading ?? 'Manage your subscription, view usage metrics, and upgrade your workspace.'}
      </p>
    </div>
  )
}
