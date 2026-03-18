import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// JSON Resume themes
const elegantTheme = require('jsonresume-theme-elegant')
const stackoverflowTheme = require('jsonresume-theme-stackoverflow')
const kendallTheme = require('jsonresume-theme-kendall')
const flatTheme = require('jsonresume-theme-flat')

const themes = {
  elegant: elegantTheme,
  stackoverflow: stackoverflowTheme,
  kendall: kendallTheme,
  flat: flatTheme
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resumeText, theme = 'elegant' } = await request.json()

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Convert profile to JSON Resume format
    const jsonResume = {
      basics: {
        name: profile?.name || 'Your Name',
        label: profile?.title || 'Professional Title',
        email: profile?.email || user.email,
        phone: profile?.phone || '',
        summary: extractSummary(resumeText),
        location: {
          city: profile?.location?.split(',')[0] || '',
          countryCode: 'US'
        },
        profiles: []
      },
      work: (profile?.experiences || []).map((exp: any) => ({
        name: exp.company,
        position: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate,
        summary: exp.context,
        highlights: extractHighlights(exp.context)
      })),
      education: (profile?.education || []).map((edu: any) => ({
        institution: edu.school,
        studyType: edu.degree.split(' ')[0],
        area: edu.degree.split(' ').slice(1).join(' '),
        endDate: edu.year
      })),
      skills: (profile?.skills || []).map((skill: string) => ({
        name: skill,
        level: 'Advanced',
        keywords: [skill]
      }))
    }

    // Generate HTML from theme
    const selectedTheme = themes[theme as keyof typeof themes] || elegantTheme
    const html = selectedTheme.render(jsonResume)

    return NextResponse.json({
      json: jsonResume,
      html,
      theme
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export resume' },
      { status: 500 }
    )
  }
}

function extractSummary(resumeText: string): string {
  // Extract summary section from markdown
  const summaryMatch = resumeText.match(/##\s*(?:Summary|Professional Summary|About)\s*\n+([\s\S]*?)(?=\n##|$)/i)
  if (summaryMatch) {
    return summaryMatch[1].trim().replace(/^[-*]\s*/gm, '').trim()
  }
  return 'Professional with extensive experience in the field.'
}

function extractHighlights(context: string): string[] {
  // Split context into bullet points
  return context
    .split(/[.!]\s+/)
    .filter(s => s.trim().length > 10)
    .slice(0, 5)
    .map(s => s.trim())
}
