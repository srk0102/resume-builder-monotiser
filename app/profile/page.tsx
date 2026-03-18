'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Loader2, Upload, Plus, Trash2, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [user, setUser] = useState<any>(null)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [experiences, setExperiences] = useState([{ company: '', role: '', startDate: '', endDate: '', context: '' }])
  const [education, setEducation] = useState([{ school: '', degree: '', year: '' }])
  const [skills, setSkills] = useState<string[]>([''])
  const [uploadError, setUploadError] = useState('')
  const [extractionCredits, setExtractionCredits] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signin'); return }
    setUser(user)
    setEmail(user.email || '')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setName(profile.name || '')
      setTitle(profile.title || '')
      setPhone(profile.phone || '')
      setLocation(profile.location || '')
      setExperiences(profile.experiences || [{ company: '', role: '', startDate: '', endDate: '', context: '' }])
      setEducation(profile.education || [{ school: '', degree: '', year: '' }])
      setSkills(profile.skills || [''])
      setExtractionCredits(profile.extraction_credits || 0)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, name, title, email, phone, location,
      experiences: experiences.filter(e => e.company),
      education: education.filter(e => e.school),
      skills: skills.filter(s => s.trim()),
      updated_at: new Date().toISOString()
    })
    if (error) { setSaveError(error.message); setSaving(false) }
    else { router.push('/generate') }
  }

  function addExperience() { setExperiences([...experiences, { company: '', role: '', startDate: '', endDate: '', context: '' }]) }
  function removeExperience(index: number) { setExperiences(experiences.filter((_, i) => i !== index)) }
  function addSkill() { setSkills([...skills, '']) }
  function removeSkill(index: number) { setSkills(skills.filter((_, i) => i !== index)) }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!allowedTypes.includes(file.type)) { setUploadError('Please upload a PDF or DOCX file'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File size must be less than 5MB'); return }

    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/parse-resume', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to parse resume')
      if (data.name) setName(data.name)
      if (data.title) setTitle(data.title)
      if (data.email) setEmail(data.email)
      if (data.phone) setPhone(data.phone)
      if (data.location) setLocation(data.location)
      if (data.experiences?.length > 0) setExperiences(data.experiences)
      if (data.education?.length > 0) setEducation(data.education)
      if (data.skills?.length > 0) setSkills(data.skills)
    } catch (error: any) {
      setUploadError(error.message || 'Failed to parse resume')
    } finally { setUploading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Portfolio' }]} />
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1">Upload your resume or manually enter your information below</p>
        </div>

        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Quick Start: Upload Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-sm font-medium mb-2">Save time! Upload your existing resume:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Supports PDF, DOC, and DOCX files</li>
                    <li>AI automatically extracts your experience, skills, and education</li>
                    <li>Review and edit before generating tailored resumes</li>
                  </ul>
                </div>
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 cursor-pointer transition-colors">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Parsing resume...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="text-xs text-muted-foreground">PDF or DOCX (max 5MB)</span>
                      </div>
                    )}
                  </div>
                </label>
                {uploadError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 py-2 text-muted-foreground font-medium">Or enter manually</span>
            </div>
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-2 block">Full Name *</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" /></div>
                <div><label className="text-sm font-medium mb-2 block">Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineer" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-2 block">Email</label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
                <div><label className="text-sm font-medium mb-2 block">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" /></div>
              </div>
              <div><label className="text-sm font-medium mb-2 block">Location</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" /></div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Experience</CardTitle>
                <Button onClick={addExperience} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {experiences.map((exp, index) => (
                <div key={index} className="relative border rounded-lg p-5 pt-12 space-y-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                  {experiences.length > 1 && (
                    <Button onClick={() => removeExperience(index)} size="icon" variant="ghost"
                      className="absolute top-2 right-2 z-10 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Company" value={exp.company} onChange={(e) => { const n = [...experiences]; n[index].company = e.target.value; setExperiences(n) }} />
                    <Input placeholder="Role" value={exp.role} onChange={(e) => { const n = [...experiences]; n[index].role = e.target.value; setExperiences(n) }} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Start Date (YYYY-MM)" value={exp.startDate} onChange={(e) => { const n = [...experiences]; n[index].startDate = e.target.value; setExperiences(n) }} />
                    <Input placeholder="End Date (YYYY-MM or Present)" value={exp.endDate} onChange={(e) => { const n = [...experiences]; n[index].endDate = e.target.value; setExperiences(n) }} />
                  </div>
                  <Textarea placeholder="Describe your role, achievements, technologies used..." value={exp.context}
                    onChange={(e) => { const n = [...experiences]; n[index].context = e.target.value; setExperiences(n) }} rows={3} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {skills.map((skill, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input placeholder="e.g. React, TypeScript, AWS" value={skill}
                    onChange={(e) => { const n = [...skills]; n[index] = e.target.value; setSkills(n) }} />
                  {skills.length > 1 && (
                    <Button onClick={() => removeSkill(index)} size="icon" variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button onClick={addSkill} size="sm" variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Skill
              </Button>
            </CardContent>
          </Card>

          {saveError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Error saving profile</p>
                  <p className="text-sm text-destructive/80 mt-1">{saveError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button onClick={handleSave} size="lg" className="flex-1" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save & Continue'}
            </Button>
            <Button onClick={() => router.push('/generate')} size="lg" variant="outline">Skip for Now</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
