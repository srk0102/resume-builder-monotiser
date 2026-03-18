'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/profile` },
    })

    if (error) {
      // If user already exists, try signing them in
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          window.location.href = '/dashboard'
          return
        }
      } else {
        setError(error.message)
      }
    } else if (data.user && !data.user.identities?.length) {
      // Supabase returns a user with empty identities if email already exists (when email confirmations enabled)
      setError('An account with this email already exists. Please sign in instead.')
    } else {
      setSuccess(true)
    }

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
            <p className="text-muted-foreground">We sent a verification link to <strong className="text-foreground">{email}</strong></p>
            <p className="text-sm text-muted-foreground">Click the link in the email to verify your account and complete setup.</p>
            <Button variant="outline" onClick={() => setSuccess(false)}>Back to Sign Up</Button>
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-muted-foreground mt-2">Start generating ATS-optimized resumes</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                {error}
                {error.includes('already exists') && (
                  <Link href="/signin" className="block mt-2 font-medium text-primary hover:underline">Go to Sign In →</Link>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Sign Up'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
