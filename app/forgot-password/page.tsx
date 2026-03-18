'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) { setError(error.message) } else { setSuccess(true) }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">We sent a password reset link to <strong className="text-foreground">{email}</strong></p>
            <p className="text-sm text-muted-foreground">Click the link in the email to reset your password.</p>
            <Button variant="outline" asChild><Link href="/signin">Back to Sign In</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground">
            Remember your password?{' '}
            <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
