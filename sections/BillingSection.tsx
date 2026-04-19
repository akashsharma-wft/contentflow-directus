// sections/BillingSection.tsx
//
// FIX: SectionRenderer calls <BillingSection lang={lang} /> but the component
// accepted no arguments. Added lang prop to the signature.
import { BillingPageClient } from '@/features/billing/components/BillingPageClient'

export type BillingConfig = {
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

interface Props {
  lang?: string
}

export async function BillingSection({ lang: _lang = 'en' }: Props) {
  return <BillingPageClient config={{}} />
}