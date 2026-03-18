import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!

const stripe = require('stripe')(STRIPE_SECRET_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan || !['basic', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plans: Record<string, { amount: number; credits: number; extractions: number; name: string }> = {
      basic: {
        amount: 500, // $5.00
        credits: 55,
        extractions: 5,
        name: 'Basic Pack - 55 Resumes + 5 Extractions'
      },
      pro: {
        amount: 1500, // $15.00
        credits: 200,
        extractions: 15,
        name: 'Pro Pack - 200 Resumes + 15 Extractions'
      }
    }

    const selectedPlan = plans[plan]

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.credits} resume generations + ${selectedPlan.extractions} resume extractions. Credits valid for 30 days. No refunds.`,
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: `${request.headers.get('origin')}/settings?payment=cancelled`,
      metadata: {
        user_id: user.id,
        plan: plan,
        credits: selectedPlan.credits.toString(),
        extractions: selectedPlan.extractions.toString()
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
