'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/generate') }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
