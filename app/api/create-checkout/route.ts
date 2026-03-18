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

    if (!plan || !['basic', 'pro', 'unlimited'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plans = {
      basic: {
        amount: 500, // $5.00
        credits: 55,
        name: 'Basic Pack - 55 Resumes'
      },
      pro: {
        amount: 1500, // $15.00
        credits: 200,
        name: 'Pro Pack - 200 Resumes'
      },
      unlimited: {
        amount: 2900, // $29.00
        credits: 9999,
        name: 'Unlimited Monthly',
        recurring: true
      }
    }

    const selectedPlan = plans[plan as keyof typeof plans]

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.credits} resume generation credits`,
            },
            unit_amount: selectedPlan.amount,
            ...(selectedPlan.recurring && {
              recurring: {
                interval: 'month'
              }
            })
          },
          quantity: 1,
        },
      ],
      mode: selectedPlan.recurring ? 'subscription' : 'payment',
      success_url: `${request.headers.get('origin')}/generate?payment=success`,
      cancel_url: `${request.headers.get('origin')}/settings?payment=cancelled`,
      metadata: {
        user_id: user.id,
        plan: plan,
        credits: selectedPlan.credits.toString()
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
