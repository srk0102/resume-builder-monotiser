'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, Check, FileText, CreditCard, Calendar, TrendingUp } from 'lucide-react'

export default function AccountPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totalResumes: 0, thisMonth: 0, lastGenerated: '' })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadAccount() }, [])

  async function loadAccount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signin'); return }
    setUser(user)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [{ data: creditData }, { count: totalResumes }, { count: thisMonth }, { data: lastGen }] = await Promise.all([
      supabase.from('credits').select('remaining_credits').eq('user_id', user.id).single(),
      supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
      supabase.from('generations').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
    ])

    setCredits(creditData?.remaining_credits || 0)
    setStats({
      totalResumes: totalResumes || 0,
      thisMonth: thisMonth || 0,
      lastGenerated: lastGen?.[0]?.created_at || ''
    })
    setLoading(false)
  }

  async function handleUpdatePassword() {
    if (!newPassword) { setError('Enter a new password'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setSaving(true); setError(''); setMessage('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError(error.message)
    else { setMessage('Password updated successfully.'); setNewPassword(''); setConfirmPassword('') }
    setSaving(false)
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={null} />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} credits={credits} />

      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]} />

        <h1 className="text-3xl font-bold text-foreground mt-4 mb-8">Profile</h1>

        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.totalResumes}</span>
                <span className="text-xs text-muted-foreground">Total Resumes</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.thisMonth}</span>
                <span className="text-xs text-muted-foreground">This Month</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-foreground">{credits}</span>
                <span className="text-xs text-muted-foreground">Credits Left</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">{formatDate(stats.lastGenerated)}</span>
                <span className="text-xs text-muted-foreground">Last Generated</span>
              </CardContent>
            </Card>
          </div>

          {/* Email (read-only) */}
          <Card>
            <CardHeader><CardTitle>Email Address</CardTitle></CardHeader>
            <CardContent>
              <Input value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-2">Email cannot be changed.</p>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Password</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>
              <Button onClick={handleUpdatePassword} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/5 border border-destructive/30 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2 text-primary text-sm p-3 bg-primary/5 border border-primary/30 rounded-lg">
              <Check className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
