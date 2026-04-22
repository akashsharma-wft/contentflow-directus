// ─── app/api/create-checkout-session/route.ts ────────────────────────────────
// Creates a Stripe Checkout Session server-side.
// SECURITY: Stripe secret key only used here — never on the client.
// Client calls this endpoint, gets back a URL, redirects to Stripe.
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })

  try {
    // Authenticate the user server-side first
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { priceId, lang = 'en' } = body

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const langPrefix = lang && lang !== 'en' ? `/${lang}` : ''
    const successUrl = `${appUrl}${langPrefix}/billing-success`
    const cancelUrl  = `${appUrl}${langPrefix}/billing`

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Pass user ID in metadata so webhook can identify who paid
      metadata: { userId: user.id },
      customer_email: user.email,
      success_url: successUrl,
      cancel_url:  cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}