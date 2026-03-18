'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FileText, Loader2, User, Settings, LogOut, Download, Eye } from 'lucide-react'

export default function GeneratePage() {
  const [jd, setJd] = useState('')
  const [descLength, setDescLength] = useState<'short' | 'long'>('short')
  const [resume, setResume] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('elegant')
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: creditData } = await supabase
        .from('credits')
        .select('remaining')
        .eq('user_id', user.id)
        .single()

      setCredits(creditData?.remaining || 0)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleExport(format: 'html' | 'pdf' | 'json') {
    setExporting(true)

    try {
      const response = await fetch('/api/export-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resume,
          theme: selectedTheme
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Export failed')
      }

      if (format === 'html') {
        // Download HTML
        const blob = new Blob([data.html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resume-${selectedTheme}.html`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'json') {
        // Download JSON
        const blob = new Blob([JSON.stringify(data.json, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'resume.json'
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        // Open HTML in new window for printing to PDF
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(data.html)
          win.document.close()
          setTimeout(() => win.print(), 500)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setExporting(false)
    }
  }

  async function handleGenerate() {
    if (!jd.trim()) {
      setError('Please paste a job description')
      return
    }

    // Check if user has completed profile
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, experiences')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || !profile.name || !profile.experiences || profile.experiences.length === 0) {
        setError('Please complete your profile first! Add your name and at least one work experience.')
        setTimeout(() => router.push('/profile'), 2000)
        return
      }
    }

    setLoading(true)
    setError('')
    setResume('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, descLength }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate resume')
      }

      setResume(data.text)

      // Reload credits after generation
      loadUser()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(user ? '/generate' : '/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <FileText className="h-6 w-6" />
            <span className="font-semibold text-lg">Resume Builder</span>
          </button>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="text-sm">
                  <span className="font-medium">{credits}</span> credits
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            )}
            {!user && (
              <Button variant="outline" onClick={() => router.push('/signin')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Paste the job posting
                </label>
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Resume Length
                </label>
                <Select
                  value={descLength}
                  onChange={(e) => setDescLength(e.target.value as 'short' | 'long')}
                >
                  <option value="short">Short (1 page)</option>
                  <option value="long">Long (Detailed)</option>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Resume'
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {resume ? (
                <div className="space-y-4">
                  <div className="max-h-[600px] overflow-y-auto bg-white p-6 rounded border prose prose-sm max-w-none">
                    <ReactMarkdown>{resume}</ReactMarkdown>
                  </div>

                  {/* Theme Selection */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <label className="text-sm font-medium mb-2 block">Choose a Professional Theme</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['elegant', 'stackoverflow', 'kendall', 'flat'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setSelectedTheme(theme)}
                          className={`px-3 py-2 text-sm rounded border transition-all ${
                            selectedTheme === theme
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(resume)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      variant="outline"
                    >
                      {copied ? 'Copied!' : 'Copy Text'}
                    </Button>
                    <Button
                      onClick={() => handleExport('html')}
                      disabled={exporting}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download HTML
                    </Button>
                    <Button
                      onClick={() => handleExport('pdf')}
                      disabled={exporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Print to PDF
                    </Button>
                    <Button
                      onClick={() => handleExport('json')}
                      disabled={exporting}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      JSON Resume
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Your resume will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
