import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function logEvent(eventId: string, eventType: string, userId: string | null, amount: number, currency: string, status: string, metadata: any, errorMessage?: string) {
  await supabase.from('payment_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    user_id: userId,
    amount,
    currency,
    status,
    metadata,
    error_message: errorMessage
  }).then(({ error }) => {
    if (error) console.error('Failed to log payment event:', error)
  })
}

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

    console.log(`Stripe webhook: ${event.type} (${event.id})`)

    // Handle successful checkout payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      // SECURITY: Only add credits if payment is actually confirmed paid
      if (session.payment_status !== 'paid') {
        console.warn(`Checkout completed but payment_status is "${session.payment_status}" — skipping credit grant`)
        await logEvent(event.id, event.type, session.metadata?.user_id || null, 0, 'usd', 'unpaid', session.metadata, `payment_status: ${session.payment_status}`)
        return NextResponse.json({ received: true })
      }

      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan
      const amountPaid = (session.amount_total || 0) / 100

      // SECURITY: Determine credits from the verified payment amount, NOT from metadata
      // This prevents any tampering with metadata credits
      const PLAN_MAP: Record<number, { credits: number; extractions: number; plan: string }> = {
        500: { credits: 55, extractions: 5, plan: 'basic' },    // $5.00
        1500: { credits: 200, extractions: 15, plan: 'pro' },   // $15.00
      }

      const verifiedPlan = PLAN_MAP[session.amount_total]

      if (!verifiedPlan) {
        console.error(`Unknown payment amount: ${session.amount_total} cents — not granting credits`)
        await logEvent(event.id, event.type, userId, session.amount_total, 'usd', 'error', session.metadata, `Unknown amount: ${session.amount_total}`)
        return NextResponse.json({ received: true })
      }

      if (!userId) {
        console.error('No user_id in session metadata — cannot grant credits')
        await logEvent(event.id, event.type, null, session.amount_total, 'usd', 'error', session.metadata, 'Missing user_id')
        return NextResponse.json({ received: true })
      }

      // Check for duplicate processing (idempotency)
      const paymentId = session.payment_intent || session.id
      const { data: existing } = await supabase
        .from('payment_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .single()

      if (existing) {
        console.warn(`Event ${event.id} already processed — skipping`)
        return NextResponse.json({ received: true })
      }

      const { error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credits: verifiedPlan.credits,
        p_stripe_payment_id: paymentId,
        p_amount_paid: amountPaid
      })

      if (error) {
        console.error('Error adding credits:', error)
        await logEvent(event.id, event.type, userId, session.amount_total, 'usd', 'error', session.metadata, error.message)
        return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
      }

      if (verifiedPlan.extractions > 0) {
        await supabase.rpc('add_extraction_credits', {
          p_user_id: userId,
          p_credits: verifiedPlan.extractions
        })
      }

      console.log(`PAID: Added ${verifiedPlan.credits} credits + ${verifiedPlan.extractions} extractions to user ${userId} (plan: ${verifiedPlan.plan}, amount: $${amountPaid})`)
      await logEvent(event.id, event.type, userId, session.amount_total, 'usd', 'success', {
        plan: verifiedPlan.plan,
        credits_granted: verifiedPlan.credits,
        extractions_granted: verifiedPlan.extractions,
        payment_intent: paymentId,
      })
    }

    // Payment intent succeeded
    else if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object
      await logEvent(event.id, event.type, intent.metadata?.user_id || null, intent.amount, intent.currency, 'success', intent.metadata)
      console.log(`Payment succeeded: ${intent.id} - $${intent.amount / 100}`)
    }

    // Invoice payment failed (card declined, insufficient funds, etc.)
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      const userId = invoice.metadata?.user_id || null
      const errorMsg = invoice.last_payment_error?.message || 'Payment failed'

      await logEvent(event.id, event.type, userId, invoice.amount_due, invoice.currency, 'failed', {
        invoice_id: invoice.id,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt,
      }, errorMsg)

      console.error(`Payment failed for invoice ${invoice.id}: ${errorMsg}`)
    }

    // Invoice payment succeeded
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      await logEvent(event.id, event.type, invoice.metadata?.user_id || null, invoice.amount_paid, invoice.currency, 'success', {
        invoice_id: invoice.id,
      })
      console.log(`Invoice paid: ${invoice.id} - $${invoice.amount_paid / 100}`)
    }

    // Payment requires additional action (3D Secure, etc.)
    else if (event.type === 'invoice.payment_action_required') {
      const invoice = event.data.object
      await logEvent(event.id, event.type, invoice.metadata?.user_id || null, invoice.amount_due, invoice.currency, 'action_required', {
        invoice_id: invoice.id,
      })
      console.log(`Payment action required for invoice ${invoice.id}`)
    }

    // Checkout session expired (user abandoned)
    else if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      await logEvent(event.id, event.type, session.metadata?.user_id || null, 0, 'usd', 'expired', session.metadata)
      console.log(`Checkout expired for user ${session.metadata?.user_id}`)
    }

    // Log any other events we're listening to
    else {
      await logEvent(event.id, event.type, null, 0, 'usd', 'received', { raw_type: event.type })
      console.log(`Unhandled event type: ${event.type}`)
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
