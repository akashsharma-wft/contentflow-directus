import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { readItems, updateItem } from '@directus/sdk'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema } from '@/types/directus'

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const rawBody = await request.text() // Must be raw text, NOT .json()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any

  try {
    // Verify the webhook came from Stripe — rejects tampered payloads
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Use service role key here — webhook runs server-side, needs to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Handle checkout.session.completed — user successfully paid
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId

    if (!userId) {
      return NextResponse.json({ error: 'No userId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        stripe_customer_id: session.customer as string,
        subscription_id: session.subscription as string,
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update subscription:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object

    // Find user by subscription_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_id', subscription.id)
      .single()

    if (profile?.id) {
      // Downgrade tier
      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free', subscription_id: null })
        .eq('id', profile.id)

      // Fetch all published posts for this user, ordered newest first
      const publishedPosts = (await directusAdminClient.request(
        readItems('posts' as keyof DirectusSchema, {
          filter: {
            author_id: { _eq: profile.id },
            published_at: { _nnull: true },
          },
          sort: ['-published_at'],
          fields: ['id'] as never,
        } as never)
      )) as unknown as { id: string }[]

      // Posts beyond the 5 most recent get unpublished (published_at = null → draft)
      const postsToUnpublish = publishedPosts.slice(5)

      for (const post of postsToUnpublish) {
        await directusAdminClient.request(
          updateItem('posts' as keyof DirectusSchema, post.id, { published_at: null } as never)
        )
      }

      if (postsToUnpublish.length > 0) {
        console.log(`Downgraded user ${profile.id}: unpublished ${postsToUnpublish.length} posts`)
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object

    if (subscription.cancel_at_period_end && subscription.cancel_at) {
      // User has cancelled — mark the cancellation date
      await supabase
        .from('profiles')
        .update({
          subscription_cancel_at: new Date(subscription.cancel_at * 1000).toISOString(),
        })
        .eq('subscription_id', subscription.id)
    } else if (!subscription.cancel_at_period_end) {
      // User reactivated (clicked "Don't cancel")
      await supabase
        .from('profiles')
        .update({ subscription_cancel_at: null })
        .eq('subscription_id', subscription.id)
    }
  }

  return NextResponse.json({ received: true })
}
