'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Loader2, CreditCard, Package, Check, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signin'); return }
    setUser(user)
    const { data: creditData } = await supabase.from('credits').select('*').eq('user_id', user.id).single()
    setCredits(creditData)
    setLoading(false)
  }

  async function handlePurchase(plan: 'basic' | 'pro' | 'unlimited') {
    setPurchasing(true)
    setPurchaseError('')
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session')
      window.location.href = data.url
    } catch (error: any) { setPurchaseError(error.message); setPurchasing(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const plans = [
    { id: 'basic', name: 'Basic Pack', price: '$5', credits: 55, extractions: 5, popular: true, features: ['5 resume extractions', '55 resume generations', 'All AI features included', 'Multiple themes', 'Credits valid for 30 days', 'One-time payment', 'No refunds'] },
    { id: 'pro', name: 'Pro Pack', price: '$15', credits: 200, extractions: 15, features: ['15 resume extractions', '200 resume generations', 'All AI features included', 'Multiple themes', 'Priority support', 'Credits valid for 30 days', 'One-time payment', 'No refunds'] },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} credits={credits?.remaining_credits || 0} />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Buy Credits' }]} />
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-foreground">Buy Credits</h1>
          <p className="text-muted-foreground mt-1">Manage your credits and subscriptions</p>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle>Your Credits</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{credits?.remaining_credits || 0}</p>
                <p className="text-muted-foreground">Credits remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Purchase Credits</h2>

          {purchaseError && (
            <Card className="mb-6 border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Payment Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{purchaseError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.popular ? 'border-primary border-2' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Package className="h-6 w-6 text-muted-foreground" />
                    {plan.popular && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Popular</span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">one-time</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => handlePurchase(plan.id as any)} disabled={purchasing} className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}>
                    {purchasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Purchase'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
            By making a purchase, you agree to our{' '}
            <a href="/terms" className="text-primary underline hover:text-primary/80">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary underline hover:text-primary/80">Privacy Policy</a>.
            All purchases are final. No refunds. Credits expire 30 days after purchase.
          </p>
        </div>
      </div>
    </div>
  )
}
