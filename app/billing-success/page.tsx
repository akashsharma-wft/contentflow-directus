// app/billing-success/page.tsx
//
// Stripe redirects here after a successful checkout.
// 1. Verifies the Stripe session server-side (fallback for missed webhooks).
// 2. Updates subscription_tier → 'pro' if session.payment_status === 'paid'.
// 3. Renders content from the Directus 'billing-success' page.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { getPageBySlugAndLang } from '@/lib/directus/queries'
import { SectionRenderer } from '@/sections/SectionRenderer'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { BillingSuccessHeroSection } from '@/sections/BillingSuccessHeroSection'
import { BillingSuccessActionsSection } from '@/sections/BillingSuccessActionsSection'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ session_id?: string; lang?: string }>
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/billing-success')

  const { session_id, lang = 'en' } = await searchParams

  // ── Server-side Stripe verification (webhook fallback) ────────────────────
  // If the session is paid and belongs to this user, upgrade immediately.
  // The webhook does the same — whichever fires first wins (idempotent update).
  if (session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      if (
        session.payment_status === 'paid' &&
        session.metadata?.userId === user.id
      ) {
        const adminSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        await adminSupabase
          .from('profiles')
          .update({
            subscription_tier: 'pro',
            stripe_customer_id: session.customer as string,
            subscription_id:    session.subscription as string,
          })
          .eq('id', user.id)
      }
    } catch { /* webhook handles it if this fails */ }
  }

  // ── Render from Directus ──────────────────────────────────────────────────
  const page = await getPageBySlugAndLang('billing-success', lang)
  const sections = page?.sections ?? []

  return (
    <DashboardLayout lang="en">
      {sections.length > 0 ? (
        <SectionRenderer sections={sections} lang={lang} />
      ) : (
        // Fallback if page not yet seeded in Directus
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <BillingSuccessHeroSection content={{ heading: 'Subscription Activated!', subheading: 'Your Pro plan is now active.' }} />
          <BillingSuccessActionsSection content={{}} />
        </div>
      )}
    </DashboardLayout>
  )
}
