'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, Upload, Plus, Trash2, AlertCircle, LogOut } from 'lucide-react'

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

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/signin')
      return
    }

    setUser(user)
    setEmail(user.email || '')

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

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

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name,
        title,
        email,
        phone,
        location,
        experiences: experiences.filter(e => e.company),
        education: education.filter(e => e.school),
        skills: skills.filter(s => s.trim()),
        updated_at: new Date().toISOString()
      })

    if (error) {
      setSaveError(error.message)
      setSaving(false)
    } else {
      router.push('/generate')
    }
  }

  function addExperience() {
    setExperiences([...experiences, { company: '', role: '', startDate: '', endDate: '', context: '' }])
  }

  function removeExperience(index: number) {
    setExperiences(experiences.filter((_, i) => i !== index))
  }

  function addSkill() {
    setSkills([...skills, ''])
  }

  function removeSkill(index: number) {
    setSkills(skills.filter((_, i) => i !== index))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or DOCX file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse resume')
      }

      // Auto-populate fields with parsed data
      if (data.name) setName(data.name)
      if (data.title) setTitle(data.title)
      if (data.email) setEmail(data.email)
      if (data.phone) setPhone(data.phone)
      if (data.location) setLocation(data.location)
      if (data.experiences && data.experiences.length > 0) setExperiences(data.experiences)
      if (data.education && data.education.length > 0) setEducation(data.education)
      if (data.skills && data.skills.length > 0) setSkills(data.skills)

    } catch (error: any) {
      setUploadError(error.message || 'Failed to parse resume')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/generate')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <FileText className="h-6 w-6" />
            <span className="font-semibold text-lg">Resume Builder</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
              <Upload className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                {extractionCredits} {extractionCredits === 1 ? 'extraction' : 'extractions'} left
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/generate')}>
              Back to Generator
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-gray-600 mt-1">Upload your resume or manually enter your information below</p>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Upload className="h-5 w-5" />
                Quick Start: Upload Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Save time! Upload your existing resume:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                    <li>Supports PDF, DOC, and DOCX files</li>
                    <li>AI automatically extracts your experience, skills, and education</li>
                    <li>Review and edit before generating tailored resumes</li>
                  </ul>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Parsing resume...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm font-medium">Click to upload</span>
                          <span className="text-xs text-gray-500">PDF or DOCX (max 5MB)</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                {uploadError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-4 py-2 text-gray-500 font-medium">
                Or enter manually
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineer" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Experience</CardTitle>
                <Button onClick={addExperience} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {experiences.map((exp, index) => (
                <div key={index} className="relative border-2 border-blue-100 bg-blue-50/30 p-5 pt-12 rounded-lg space-y-4 hover:border-blue-200 transition-colors">
                  {experiences.length > 1 && (
                    <Button
                      onClick={() => removeExperience(index)}
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      title="Remove experience"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...experiences]
                        newExp[index].company = e.target.value
                        setExperiences(newExp)
                      }}
                    />
                    <Input
                      placeholder="Role"
                      value={exp.role}
                      onChange={(e) => {
                        const newExp = [...experiences]
                        newExp[index].role = e.target.value
                        setExperiences(newExp)
                      }}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Start Date (YYYY-MM)"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...experiences]
                        newExp[index].startDate = e.target.value
                        setExperiences(newExp)
                      }}
                    />
                    <Input
                      placeholder="End Date (YYYY-MM or Present)"
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...experiences]
                        newExp[index].endDate = e.target.value
                        setExperiences(newExp)
                      }}
                    />
                  </div>
                  <Textarea
                    placeholder="Describe your role, achievements, technologies used..."
                    value={exp.context}
                    onChange={(e) => {
                      const newExp = [...experiences]
                      newExp[index].context = e.target.value
                      setExperiences(newExp)
                    }}
                    rows={3}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {skills.map((skill, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="e.g. React, TypeScript, AWS"
                    value={skill}
                    onChange={(e) => {
                      const newSkills = [...skills]
                      newSkills[index] = e.target.value
                      setSkills(newSkills)
                    }}
                    className="bg-green-50/50 border-green-100 focus:border-green-300"
                  />
                  {skills.length > 1 && (
                    <Button
                      onClick={() => removeSkill(index)}
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      title="Remove skill"
                    >
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error saving profile</p>
                <p className="text-sm text-red-700 mt-1">{saveError}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={handleSave} size="lg" className="flex-1" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
            <Button onClick={() => router.push('/generate')} size="lg" variant="outline">
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
