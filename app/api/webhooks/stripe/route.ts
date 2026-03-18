import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_API_KEY = process.env.RESEND_API_KEY!

const stripe = require('stripe')(STRIPE_SECRET_KEY)
const resend = new Resend(RESEND_API_KEY)

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

async function sendReceiptEmail(email: string, plan: string, amount: number, credits: number, extractions: number, paymentId: string) {
  const planName = plan === 'basic' ? 'Basic Pack' : 'Pro Pack'
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  try {
    await resend.emails.send({
      from: 'AI Resume Builder <noreply@ai-resum.dev>',
      to: email,
      subject: `Payment Receipt — ${planName} ($${amount})`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#7c3aed;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">AI Resume Builder</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;font-weight:600;">Payment Receipt</h2>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:13px;">Thank you for your purchase!</p>

              <!-- Invoice Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Date</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:500;">${date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Plan</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:500;">${planName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Resume Generations</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:500;">${credits} credits</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Resume Extractions</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:500;">${extractions} credits</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Credits Valid Until</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:500;">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background-color:#f4f4f5;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#18181b;font-size:15px;font-weight:600;">Total Paid</td>
                        <td align="right" style="color:#7c3aed;font-size:18px;font-weight:700;">$${amount.toFixed(2)} USD</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;line-height:1.5;">
                Transaction ID: ${paymentId}
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td align="center">
                    <a href="https://ai-resum.dev/dashboard" style="display:inline-block;background-color:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Start Generating Resumes
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;line-height:1.5;text-align:center;">
                All purchases are final. No refunds. Credits expire 30 days after purchase.<br>
                By purchasing, you agreed to our <a href="https://ai-resum.dev/terms" style="color:#7c3aed;text-decoration:none;">Terms of Service</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
                &copy; 2026 AI Resume Builder &middot; <a href="https://ai-resum.dev/privacy" style="color:#7c3aed;text-decoration:none;">Privacy</a> &middot; <a href="https://ai-resum.dev/terms" style="color:#7c3aed;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    })
    console.log(`Receipt email sent to ${email}`)
  } catch (err) {
    console.error('Failed to send receipt email:', err)
  }
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
      const amountPaid = (session.amount_total || 0) / 100

      // SECURITY: Determine credits from the verified payment amount, NOT from metadata
      const PLAN_MAP: Record<number, { credits: number; extractions: number; plan: string }> = {
        500: { credits: 55, extractions: 5, plan: 'basic' },
        1500: { credits: 200, extractions: 15, plan: 'pro' },
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

      // Send receipt email
      const customerEmail = session.customer_email || session.customer_details?.email
      if (customerEmail) {
        await sendReceiptEmail(customerEmail, verifiedPlan.plan, amountPaid, verifiedPlan.credits, verifiedPlan.extractions, paymentId)
      }
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
