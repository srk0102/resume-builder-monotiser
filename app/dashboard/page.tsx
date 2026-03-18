'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, FileText, Clock, Download, Trash2, Plus, Eye, CheckCircle2, XCircle } from 'lucide-react'

interface Generation {
  id: string
  created_at: string
  job_description: string
  description_length: string
  resume_text: string
  status: string
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [loadingPreviews, setLoadingPreviews] = useState<Record<string, boolean>>({})
  const [showBanner, setShowBanner] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const payment = searchParams.get('payment')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signin'); return }
    setUser(user)

    const [{ data: creditData }, { data: gens }] = await Promise.all([
      supabase.from('credits').select('remaining_credits').eq('user_id', user.id).single(),
      supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    ])

    setCredits(creditData?.remaining_credits || 0)
    setGenerations(gens || [])
    setLoading(false)

    // Load previews for all generations
    if (gens && gens.length > 0) {
      gens.forEach((gen) => loadPreview(gen))
    }
  }

  async function loadPreview(gen: Generation) {
    setLoadingPreviews(prev => ({ ...prev, [gen.id]: true }))
    try {
      const jsonResume = JSON.parse(gen.resume_text)
      const response = await fetch('/api/export-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonResume, theme: 'elegant' })
      })
      const data = await response.json()
      if (response.ok) {
        setPreviews(prev => ({ ...prev, [gen.id]: data.html }))
      }
    } catch { /* silent */ } finally {
      setLoadingPreviews(prev => ({ ...prev, [gen.id]: false }))
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('generations').delete().eq('id', id)
    setGenerations(prev => prev.filter(g => g.id !== id))
    setPreviews(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  function handleOpen(gen: Generation) {
    router.push(`/generate/${gen.id}`)
  }

  function handleDownload(gen: Generation) {
    const html = previews[gen.id]
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `resume-${extractTitle(gen.job_description).replace(/\s+/g, '-').toLowerCase()}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function extractTitle(jd: string) {
    const lines = jd.split('\n').filter(l => l.trim().length > 5)
    const first = lines[0]?.trim() || 'Untitled'
    return first.length > 50 ? first.substring(0, 47) + '...' : first
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

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Payment Banner */}
        {payment === 'success' && showBanner && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Payment successful!</p>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">Credits have been added to your account.</p>
              </div>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-green-600 dark:text-green-400 hover:opacity-70">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
        {payment === 'cancelled' && showBanner && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-300">Payment cancelled</p>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">No charges were made. You can purchase credits anytime from Buy Credits.</p>
              </div>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-yellow-600 dark:text-yellow-400 hover:opacity-70">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {generations.length > 0
                ? `${generations.length} resume${generations.length !== 1 ? 's' : ''} generated`
                : 'Get started by generating your first resume'}
            </p>
          </div>
          <Button onClick={() => router.push('/generate')} size="lg">
            <Plus className="h-4 w-4" />
            Generate New Resume
          </Button>
        </div>

        {/* Resume Cards Grid */}
        {generations.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Paste a job description and our AI will generate a tailored resume for you in seconds.
              </p>
              <Button onClick={() => router.push('/generate')} size="lg">
                <Plus className="h-4 w-4" />
                Generate Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((gen) => (
              <Card key={gen.id} className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/30">
                {/* Preview Thumbnail */}
                <div className="relative aspect-[8.5/11] bg-white overflow-hidden cursor-pointer" onClick={() => handleOpen(gen)}>
                  {loadingPreviews[gen.id] ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : previews[gen.id] ? (
                    <iframe
                      srcDoc={previews[gen.id]}
                      className="w-[200%] h-[200%] border-0 pointer-events-none origin-top-left scale-50"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                      <FileText className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="sm" className="shadow-lg">
                      <Eye className="h-4 w-4" />
                      Open in Editor
                    </Button>
                  </div>
                </div>

                {/* Card Info */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {extractTitle(gen.job_description)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(gen.created_at)}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {gen.description_length === 'long' ? 'Detailed' : 'Concise'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline" size="sm" className="flex-1"
                      onClick={() => handleOpen(gen)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleDownload(gen)}
                      disabled={!previews[gen.id]}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(gen.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
