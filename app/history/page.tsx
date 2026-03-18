'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, FileText, Clock, Eye, Trash2, ArrowRight } from 'lucide-react'

interface Generation {
  id: string
  created_at: string
  job_description: string
  description_length: string
  resume_text: string
  status: string
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  const router = useRouter()
  const supabase = createClient()

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
  }

  async function handlePreview(gen: Generation) {
    setSelectedId(gen.id)
    setLoadingPreview(true)
    try {
      const jsonResume = JSON.parse(gen.resume_text)
      const response = await fetch('/api/export-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonResume, theme: 'elegant' })
      })
      const data = await response.json()
      if (response.ok) setPreviewHtml(data.html)
    } catch { /* silent */ } finally { setLoadingPreview(false) }
  }

  async function handleDelete(id: string) {
    await supabase.from('generations').delete().eq('id', id)
    setGenerations(prev => prev.filter(g => g.id !== id))
    if (selectedId === id) { setSelectedId(null); setPreviewHtml('') }
  }

  function handleLoadInGenerator(gen: Generation) {
    // Store in sessionStorage so generate page can pick it up
    sessionStorage.setItem('loadResume', gen.resume_text)
    router.push('/generate')
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function extractTitle(jd: string) {
    // Try to get first meaningful line from JD
    const lines = jd.split('\n').filter(l => l.trim().length > 5)
    const first = lines[0]?.trim() || 'Untitled'
    return first.length > 60 ? first.substring(0, 57) + '...' : first
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar user={user} credits={credits} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left - History List */}
        <div className="w-1/3 min-w-[320px] border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-foreground">Generation History</h2>
            <p className="text-xs text-muted-foreground mt-1">{generations.length} resumes generated</p>
          </div>
          <div className="flex-1 overflow-auto">
            {generations.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No resumes generated yet</p>
                <Button className="mt-4" onClick={() => router.push('/generate')}>
                  <ArrowRight className="h-4 w-4" />Generate Your First
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {generations.map((gen) => (
                  <div
                    key={gen.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedId === gen.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => handlePreview(gen)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {extractTitle(gen.job_description)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(gen.created_at)}</span>
                        </div>
                        <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {gen.description_length === 'long' ? 'Detailed' : 'Concise'}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); handleLoadInGenerator(gen) }}
                          title="Open in generator"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(gen.id) }}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Preview */}
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          {selectedId ? (
            <div className="max-w-[850px] mx-auto bg-card shadow-lg rounded-lg min-h-full">
              {loadingPreview ? (
                <div className="p-8 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full min-h-[1100px] border-0 rounded-lg"
                  title="Resume Preview"
                />
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">Select a resume to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
