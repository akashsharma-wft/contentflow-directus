import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Stripe redirects here when the user closes the checkout modal without paying.
// Just send them back to /billing — no state change needed.
export default function BillingCancelPage() {
  redirect('/billing')
}
