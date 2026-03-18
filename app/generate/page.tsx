'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Breadcrumbs } from '@/components/breadcrumbs'
import {
  FileText, Loader2, Download, Copy, Check,
  Search, UserCheck, Sparkles, Wand2, CheckCircle2, Pencil, Eye,
  ArrowUp, ArrowDown, Trash2, Plus, X, Briefcase, GraduationCap, Wrench, User
} from 'lucide-react'

const GENERATION_STEPS = [
  { id: 'analyze', label: 'Analyzing job description', icon: Search, duration: 3000 },
  { id: 'profile', label: 'Extracting your profile details', icon: UserCheck, duration: 3000 },
  { id: 'tailor', label: 'Tailoring experience to match JD', icon: Wand2, duration: 12000 },
  { id: 'optimize', label: 'Optimizing for ATS keywords', icon: Sparkles, duration: 5000 },
  { id: 'finalize', label: 'Finalizing your resume', icon: CheckCircle2, duration: 3000 },
]

const THEMES = [
  { id: 'elegant', label: 'Elegant' },
  { id: 'stackoverflow', label: 'Stack Overflow' },
  { id: 'kendall', label: 'Kendall' },
  { id: 'flat', label: 'Flat' },
  { id: 'macchiato', label: 'Macchiato' },
  { id: 'class', label: 'Class' },
  { id: 'onepage', label: 'One Page' },
]

interface JsonResumeWork {
  name: string
  position: string
  startDate: string
  endDate: string
  summary: string
  highlights: string[]
}

interface JsonResumeEducation {
  institution: string
  studyType: string
  area: string
  startDate: string
  endDate: string
}

interface JsonResumeSkill {
  name: string
  level: string
  keywords: string[]
}

interface JsonResume {
  basics: {
    name: string
    label: string
    email: string
    phone: string
    summary: string
    location: { city: string; region: string; countryCode: string }
    profiles: { network: string; username: string; url: string }[]
  }
  work: JsonResumeWork[]
  education: JsonResumeEducation[]
  skills: JsonResumeSkill[]
}

export default function GeneratePage() {
  const [jd, setJd] = useState('')
  const [descLength, setDescLength] = useState<'short' | 'long'>('short')
  const [jsonResume, setJsonResume] = useState<JsonResume | null>(null)
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('elegant')
  const [themedHtml, setThemedHtml] = useState('')
  const [loadingTheme, setLoadingTheme] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadUser() }, [])

  // Load resume from history if available
  useEffect(() => {
    const stored = sessionStorage.getItem('loadResume')
    const storedJD = sessionStorage.getItem('loadJD')
    if (stored) {
      sessionStorage.removeItem('loadResume')
      sessionStorage.removeItem('loadJD')
      try {
        const parsed = JSON.parse(stored)
        setJsonResume(parsed)
      } catch { /* ignore */ }
      if (storedJD) setJd(storedJD)
    }
  }, [])

  useEffect(() => {
    if (jsonResume && !editMode) {
      loadTheme(selectedTheme)
    }
  }, [selectedTheme, jsonResume])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const [{ data: creditData }, { data: profile }] = await Promise.all([
        supabase.from('credits').select('remaining_credits').eq('user_id', user.id).single(),
        supabase.from('profiles').select('name, experiences').eq('id', user.id).maybeSingle()
      ])
      setCredits(creditData?.remaining_credits || 0)

      // Redirect to profile if incomplete
      if (!profile?.name || !profile?.experiences?.length) {
        router.push('/profile')
        return
      }
    }
  }

  async function loadTheme(theme: string) {
    if (!jsonResume) return
    setLoadingTheme(true)
    try {
      const response = await fetch('/api/export-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonResume, theme })
      })
      const data = await response.json()
      if (response.ok) setThemedHtml(data.html)
    } catch { /* silent */ } finally {
      setLoadingTheme(false)
    }
  }

  function handleExitEditMode() {
    setEditMode(false)
    loadTheme(selectedTheme)
  }

  // --- JSON Resume update helpers ---
  function updateBasics(field: string, value: string) {
    if (!jsonResume) return
    setJsonResume({ ...jsonResume, basics: { ...jsonResume.basics, [field]: value } })
  }

  function updateLocation(field: string, value: string) {
    if (!jsonResume) return
    setJsonResume({
      ...jsonResume,
      basics: { ...jsonResume.basics, location: { ...jsonResume.basics.location, [field]: value } }
    })
  }

  function updateWork(idx: number, field: string, value: any) {
    if (!jsonResume) return
    const work = [...jsonResume.work]
    work[idx] = { ...work[idx], [field]: value }
    setJsonResume({ ...jsonResume, work })
  }

  function updateHighlight(workIdx: number, hlIdx: number, value: string) {
    if (!jsonResume) return
    const work = [...jsonResume.work]
    const highlights = [...work[workIdx].highlights]
    highlights[hlIdx] = value
    work[workIdx] = { ...work[workIdx], highlights }
    setJsonResume({ ...jsonResume, work })
  }

  function addHighlight(workIdx: number) {
    if (!jsonResume) return
    const work = [...jsonResume.work]
    work[workIdx] = { ...work[workIdx], highlights: [...work[workIdx].highlights, ''] }
    setJsonResume({ ...jsonResume, work })
  }

  function removeHighlight(workIdx: number, hlIdx: number) {
    if (!jsonResume) return
    const work = [...jsonResume.work]
    work[workIdx] = { ...work[workIdx], highlights: work[workIdx].highlights.filter((_, i) => i !== hlIdx) }
    setJsonResume({ ...jsonResume, work })
  }

  function addWork() {
    if (!jsonResume) return
    setJsonResume({
      ...jsonResume,
      work: [...jsonResume.work, { name: '', position: '', startDate: '', endDate: '', summary: '', highlights: [''] }]
    })
  }

  function removeWork(idx: number) {
    if (!jsonResume) return
    setJsonResume({ ...jsonResume, work: jsonResume.work.filter((_, i) => i !== idx) })
  }

  function moveWork(idx: number, dir: 'up' | 'down') {
    if (!jsonResume) return
    const work = [...jsonResume.work]
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= work.length) return
    ;[work[idx], work[target]] = [work[target], work[idx]]
    setJsonResume({ ...jsonResume, work })
  }

  function updateEducation(idx: number, field: string, value: string) {
    if (!jsonResume) return
    const education = [...jsonResume.education]
    education[idx] = { ...education[idx], [field]: value }
    setJsonResume({ ...jsonResume, education })
  }

  function addEducation() {
    if (!jsonResume) return
    setJsonResume({
      ...jsonResume,
      education: [...jsonResume.education, { institution: '', studyType: '', area: '', startDate: '', endDate: '' }]
    })
  }

  function removeEducation(idx: number) {
    if (!jsonResume) return
    setJsonResume({ ...jsonResume, education: jsonResume.education.filter((_, i) => i !== idx) })
  }

  function moveEducation(idx: number, dir: 'up' | 'down') {
    if (!jsonResume) return
    const education = [...jsonResume.education]
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= education.length) return
    ;[education[idx], education[target]] = [education[target], education[idx]]
    setJsonResume({ ...jsonResume, education })
  }

  function updateSkillKeywords(idx: number, value: string) {
    if (!jsonResume) return
    const skills = [...jsonResume.skills]
    skills[idx] = { ...skills[idx], keywords: value.split(',').map(s => s.trim()).filter(Boolean) }
    setJsonResume({ ...jsonResume, skills })
  }

  function updateSkillName(idx: number, value: string) {
    if (!jsonResume) return
    const skills = [...jsonResume.skills]
    skills[idx] = { ...skills[idx], name: value }
    setJsonResume({ ...jsonResume, skills })
  }

  function addSkillCategory() {
    if (!jsonResume) return
    setJsonResume({
      ...jsonResume,
      skills: [...jsonResume.skills, { name: 'New Category', level: '', keywords: [] }]
    })
  }

  function removeSkillCategory(idx: number) {
    if (!jsonResume) return
    setJsonResume({ ...jsonResume, skills: jsonResume.skills.filter((_, i) => i !== idx) })
  }

  async function handleExport(format: 'html' | 'pdf') {
    if (!jsonResume) return
    setExporting(true)
    try {
      let html = themedHtml
      if (!html) {
        const response = await fetch('/api/export-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonResume, theme: selectedTheme })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        html = data.html
      }
      if (format === 'pdf') {
        const win = window.open('', '_blank')
        if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
      } else {
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `resume-${selectedTheme}.html`; a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err: any) { setError(err.message) } finally { setExporting(false) }
  }

  async function handleGenerate() {
    if (!jd.trim()) { setError('Please paste a job description'); return }
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('name, experiences').eq('id', user.id).maybeSingle()
      if (!profile || !profile.name || !profile.experiences || profile.experiences.length === 0) {
        setError('Please complete your profile first! Add your name and at least one work experience.')
        setTimeout(() => router.push('/profile'), 2000); return
      }
    }
    setLoading(true); setError(''); setJsonResume(null); setThemedHtml('')
    setSelectedTheme('elegant'); setEditMode(false); setGenerationStep(0)

    let step = 0
    function advanceStep() {
      if (step < GENERATION_STEPS.length - 1) {
        step++; setGenerationStep(step)
        stepTimerRef.current = setTimeout(advanceStep, GENERATION_STEPS[step].duration)
      }
    }
    stepTimerRef.current = setTimeout(advanceStep, GENERATION_STEPS[0].duration)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, descLength }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate resume')

      setGenerationStep(GENERATION_STEPS.length - 1)
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
      await new Promise(r => setTimeout(r, 600))
      setJsonResume(data.jsonResume)
      loadUser()
    } catch (err: any) { setError(err.message) } finally {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar user={user} credits={credits} />

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/4 min-w-[300px] border-r bg-card flex flex-col">
          <div className="p-4 border-b space-y-2">
            <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Generate Resume' }]} />
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Job Description</h2>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-auto">
            <Textarea
              placeholder="Paste the full job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="flex-1 min-h-[200px] text-sm resize-none"
            />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Resume Length</label>
              <Select value={descLength} onChange={(e) => setDescLength(e.target.value as 'short' | 'long')}>
                <option value="short">Concise (1 page)</option>
                <option value="long">Detailed (2 pages)</option>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="h-4 w-4" />Generate Resume</>
              )}
            </Button>
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-3">
                  <p className="text-xs text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {jsonResume ? (
            <>
              {/* Toolbar */}
              <div className="border-b bg-card px-4 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={editMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editMode ? handleExitEditMode() : setEditMode(true)}
                    className="mr-1"
                  >
                    {editMode ? <><Eye className="h-3.5 w-3.5" />Preview</> : <><Pencil className="h-3.5 w-3.5" />Edit</>}
                  </Button>

                  <div className="h-5 w-px bg-border mx-1" />

                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => { setSelectedTheme(theme.id); if (editMode) handleExitEditMode() }}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all font-medium ${
                        selectedTheme === theme.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                  {loadingTheme && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonResume, null, 2))
                    setCopied(true); setTimeout(() => setCopied(false), 2000)
                  }}>
                    {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />JSON</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('html')} disabled={exporting}>
                    <Download className="h-3.5 w-3.5" />HTML
                  </Button>
                  <Button size="sm" onClick={() => handleExport('pdf')} disabled={exporting}>
                    <Download className="h-3.5 w-3.5" />Print PDF
                  </Button>
                </div>
              </div>

              {editMode ? (
                /* ===== EDIT MODE ===== */
                <div className="flex-1 overflow-auto p-6">
                  <div className="max-w-[800px] mx-auto space-y-5">

                    {/* Personal Info */}
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <User className="h-4 w-4 text-primary" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="Full Name" value={jsonResume.basics.name} onChange={(v) => updateBasics('name', v)} />
                          <FormField label="Professional Title" value={jsonResume.basics.label} onChange={(v) => updateBasics('label', v)} />
                          <FormField label="Email" value={jsonResume.basics.email} onChange={(v) => updateBasics('email', v)} />
                          <FormField label="Phone" value={jsonResume.basics.phone} onChange={(v) => updateBasics('phone', v)} />
                          <FormField label="City" value={jsonResume.basics.location.city} onChange={(v) => updateLocation('city', v)} />
                          <FormField label="State / Region" value={jsonResume.basics.location.region} onChange={(v) => updateLocation('region', v)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Professional Summary</label>
                          <Textarea
                            value={jsonResume.basics.summary}
                            onChange={(e) => updateBasics('summary', e.target.value)}
                            rows={4}
                            className="resize-vertical"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Work Experience */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Briefcase className="h-4 w-4 text-primary" />
                            Work Experience
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={addWork}>
                            <Plus className="h-3.5 w-3.5" />Add Position
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jsonResume.work.map((w, i) => (
                          <div key={i} className="border rounded-lg p-4 relative group bg-muted/20 hover:bg-muted/40 transition-colors">
                            {/* Controls */}
                            <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveWork(i, 'up')} disabled={i === 0}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveWork(i, 'down')} disabled={i === jsonResume.work.length - 1}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeWork(i)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <FormField label="Company" value={w.name} onChange={(v) => updateWork(i, 'name', v)} />
                              <FormField label="Position" value={w.position} onChange={(v) => updateWork(i, 'position', v)} />
                              <FormField label="Start Date" value={w.startDate} onChange={(v) => updateWork(i, 'startDate', v)} placeholder="YYYY-MM" />
                              <FormField label="End Date" value={w.endDate} onChange={(v) => updateWork(i, 'endDate', v)} placeholder="YYYY-MM or leave empty" />
                            </div>

                            {/* Highlights */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Achievements & Responsibilities</label>
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={() => addHighlight(i)}>
                                  <Plus className="h-3 w-3" />Add Bullet
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {w.highlights.map((hl, hlIdx) => (
                                  <div key={hlIdx} className="flex items-start gap-2">
                                    <span className="text-muted-foreground mt-2.5 text-xs shrink-0 select-none">{hlIdx + 1}.</span>
                                    <Textarea
                                      value={hl}
                                      onChange={(e) => updateHighlight(i, hlIdx, e.target.value)}
                                      rows={2}
                                      className="flex-1 min-h-[60px] text-sm resize-vertical"
                                    />
                                    <Button variant="ghost" size="icon" className="h-7 w-7 mt-1 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeHighlight(i, hlIdx)}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        {jsonResume.work.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">No work experience added yet.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Education */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            Education
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={addEducation}>
                            <Plus className="h-3.5 w-3.5" />Add Education
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jsonResume.education.map((edu, i) => (
                          <div key={i} className="border rounded-lg p-4 relative group bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEducation(i, 'up')} disabled={i === 0}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEducation(i, 'down')} disabled={i === jsonResume.education.length - 1}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeEducation(i)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <FormField label="Institution" value={edu.institution} onChange={(v) => updateEducation(i, 'institution', v)} />
                              <FormField label="Degree Type" value={edu.studyType} onChange={(v) => updateEducation(i, 'studyType', v)} placeholder="e.g. Bachelor of Science" />
                              <FormField label="Field of Study" value={edu.area} onChange={(v) => updateEducation(i, 'area', v)} placeholder="e.g. Computer Science" />
                              <FormField label="Graduation Year" value={edu.endDate} onChange={(v) => updateEducation(i, 'endDate', v)} />
                            </div>
                          </div>
                        ))}
                        {jsonResume.education.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">No education added yet.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Skills */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Wrench className="h-4 w-4 text-primary" />
                            Skills
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={addSkillCategory}>
                            <Plus className="h-3.5 w-3.5" />Add Category
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jsonResume.skills.map((skill, i) => (
                          <div key={i} className="border rounded-lg p-4 relative group bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeSkillCategory(i)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <FormField label="Category" value={skill.name} onChange={(v) => updateSkillName(i, v)} />
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Skills (comma-separated)</label>
                                <Textarea
                                  value={skill.keywords.join(', ')}
                                  onChange={(e) => updateSkillKeywords(i, e.target.value)}
                                  rows={2}
                                  className="resize-vertical"
                                  placeholder="React, Node.js, TypeScript..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {jsonResume.skills.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">No skills added yet.</p>
                        )}
                      </CardContent>
                    </Card>

                  </div>
                </div>
              ) : (
                /* ===== PREVIEW MODE ===== */
                <div className="flex-1 overflow-auto p-6">
                  <div className="max-w-[850px] mx-auto bg-card shadow-lg rounded-lg min-h-full">
                    {themedHtml ? (
                      <iframe
                        ref={iframeRef}
                        srcDoc={themedHtml}
                        className="w-full min-h-[1100px] border-0 rounded-lg"
                        title="Resume Preview"
                      />
                    ) : (
                      <div className="p-8 flex items-center justify-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : loading ? (
            /* ===== LOADING STATE ===== */
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md px-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Crafting Your Resume</h3>
                  <p className="text-sm text-muted-foreground mt-1">This usually takes 15-30 seconds</p>
                </div>
                <div className="space-y-3">
                  {GENERATION_STEPS.map((step, i) => {
                    const StepIcon = step.icon
                    const isActive = i === generationStep
                    const isComplete = i < generationStep
                    return (
                      <div key={step.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 ${
                        isActive ? 'bg-primary/10 border border-primary/30'
                        : isComplete ? 'bg-accent/50 border border-accent'
                        : 'bg-muted border border-transparent'
                      }`}>
                        <div className={`shrink-0 ${isActive ? 'text-primary' : isComplete ? 'text-accent-foreground' : 'text-muted-foreground/40'}`}>
                          {isComplete ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <StepIcon className="h-5 w-5" />}
                        </div>
                        <span className={`text-sm font-medium ${
                          isActive ? 'text-primary' : isComplete ? 'text-accent-foreground' : 'text-muted-foreground/50'
                        }`}>{step.label}</span>
                        {isActive && (
                          <div className="ml-auto flex gap-1">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ===== EMPTY STATE ===== */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-lg font-medium text-muted-foreground/60">Paste a job description and hit Generate</p>
                <p className="text-sm text-muted-foreground/40 mt-1">Your tailored resume will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Reusable Form Field ---
function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
