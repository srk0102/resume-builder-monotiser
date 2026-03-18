'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard, Package, Check, AlertCircle, FileText, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/signin')
      return
    }

    setUser(user)

    // Load credit balance
    const { data: creditData } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setCredits(creditData)
    setLoading(false)
  }

  async function handlePurchase(plan: 'basic' | 'pro' | 'unlimited') {
    setPurchasing(true)
    setPurchaseError('')

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      setPurchaseError(error.message)
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const plans = [
    {
      id: 'basic',
      name: 'Basic Pack',
      price: '$5',
      credits: 55,
      extractions: 5,
      features: [
        '5 resume extractions',
        '55 resume generations',
        'All AI features included',
        'Download as Markdown',
        'One-time payment',
        'No refunds'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      price: '$15',
      credits: 200,
      extractions: 15,
      features: [
        '15 resume extractions',
        '200 resume generations',
        'All AI features included',
        'Download as Markdown',
        'Priority support',
        'One-time payment',
        'No refunds'
      ]
    },
    {
      id: 'unlimited',
      name: 'Unlimited Monthly',
      price: '$29/mo',
      credits: 9999,
      extractions: 999,
      features: [
        'Unlimited extractions',
        'Unlimited resume generations',
        'All AI features included',
        'Download as Markdown',
        'Priority support',
        'Cancel anytime'
      ],
      recurring: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/generate')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <FileText className="h-6 w-6" />
            <span className="font-semibold text-lg">Resume Builder</span>
          </button>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/generate')}>
              Back to Generator
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-gray-600 mt-1">Manage your credits and subscriptions</p>
        </div>

        {/* Current Credits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-lg">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{credits?.remaining || 0}</p>
                <p className="text-gray-600">Credits remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Purchase Credits</h2>

          {purchaseError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Payment Error</p>
                <p className="text-sm text-red-700 mt-1">{purchaseError}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.id === 'basic' ? 'border-purple-600 border-2' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Package className="h-6 w-6 text-gray-600" />
                    {plan.id === 'basic' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.recurring && <span className="text-gray-600 ml-1">per month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePurchase(plan.id as any)}
                    disabled={purchasing}
                    className="w-full"
                    variant={plan.id === 'basic' ? 'default' : 'outline'}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Purchase'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
