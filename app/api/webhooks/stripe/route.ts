import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const stripe = require('stripe')(STRIPE_SECRET_KEY)

// Use service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      const userId = session.metadata.user_id
      const credits = parseInt(session.metadata.credits)
      const plan = session.metadata.plan

      // Add credits to user account
      const { error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: credits
      })

      if (error) {
        console.error('Error adding credits:', error)
        return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
      }

      console.log(`Added ${credits} credits to user ${userId} (plan: ${plan})`)
    }

    // Handle subscription renewals
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = subscription.metadata?.user_id

        if (userId) {
          // Add 9999 credits for unlimited plan renewal
          await supabase.rpc('add_credits', {
            p_user_id: userId,
            p_amount: 9999
          })

          console.log(`Renewed unlimited subscription for user ${userId}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
