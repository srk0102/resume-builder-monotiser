import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Normalize dates to YYYY-MM-DD for jsonresume-themeutils compatibility
// Handles: "" -> undefined, "2023" -> "2023-01-01", "2023-2025" -> "2025-01-01" (take last year),
// "October 2025" -> "2025-10-01", "2023-01-01" -> "2023-01-01"
function fixDate(d: string | undefined): string | undefined {
  if (!d || !d.trim()) return undefined
  const s = d.trim()
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // Plain year "2023"
  if (/^\d{4}$/.test(s)) return `${s}-01-01`
  // Year range "2017-2021" — use the last year
  if (/^\d{4}-\d{4}$/.test(s)) return `${s.split('-')[1]}-01-01`
  // "Month Year" like "October 2025"
  const monthMatch = s.match(/^(\w+)\s+(\d{4})$/)
  if (monthMatch) {
    const months: Record<string, string> = { january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12' }
    const m = months[monthMatch[1].toLowerCase()]
    if (m) return `${monthMatch[2]}-${m}-01`
  }
  // "YYYY-MM" like "2023-05"
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`
  // Fallback: try to extract any 4-digit year
  const yearMatch = s.match(/(\d{4})/)
  if (yearMatch) return `${yearMatch[1]}-01-01`
  return undefined
}

// 10 JSON Resume themes from the ecosystem — https://jsonresume.org/themes
const themes: Record<string, any> = {
  elegant: require('jsonresume-theme-elegant'),
  stackoverflow: require('jsonresume-theme-stackoverflow'),
  kendall: require('jsonresume-theme-kendall'),
  macchiato: require('jsonresume-theme-macchiato'),
  engineering: require('jsonresume-theme-engineering'),
  academic: require('jsonresume-theme-academic'),
  spartan: require('jsonresume-theme-spartan'),
  orbit: require('jsonresume-theme-orbit'),
  autumn: require('jsonresume-theme-autumn'),
  one: require('jsonresume-theme-one'),
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jsonResume, theme = 'elegant' } = await request.json()

    if (!jsonResume) {
      return NextResponse.json({ error: 'JSON Resume data required' }, { status: 400 })
    }

    // Deep-clone and ensure all fields themes expect exist
    const sanitized = JSON.parse(JSON.stringify(jsonResume))
    if (!sanitized.basics) sanitized.basics = {}
    sanitized.basics.location = { address: '', city: '', region: '', postalCode: '', countryCode: '', ...(sanitized.basics.location || {}) }
    if (!sanitized.basics.profiles) sanitized.basics.profiles = []
    if (!sanitized.work) sanitized.work = []
    if (!sanitized.education) sanitized.education = []
    if (!sanitized.skills) sanitized.skills = []
    if (sanitized.education) {
      sanitized.education = sanitized.education.map((edu: any) => {
        const dateStr = edu.endDate?.toString() || ''
        // For year ranges like "2023-2025", extract LAST year
        const rangeMatch = dateStr.match(/(\d{4})\s*[-–]\s*(\d{4})/)
        const startRangeMatch = edu.startDate?.toString().match(/(\d{4})/)
        let startDate = ''
        let endDate = ''
        if (rangeMatch) {
          startDate = `${rangeMatch[1]}-05-01`
          endDate = `${rangeMatch[2]}-05-01`
        } else {
          const endYear = dateStr.match(/(\d{4})/)?.[1]
          endDate = endYear ? `${endYear}-05-01` : (fixDate(edu.endDate) || '')
          const startYear = startRangeMatch?.[1]
          startDate = startYear ? `${startYear}-05-01` : (fixDate(edu.startDate) || '')
        }
        return { ...edu, startDate, endDate }
      })
    }
    // Clear work summary to avoid duplicate rendering (summary + highlights)
    if (sanitized.work) {
      sanitized.work = sanitized.work.map((w: any) => ({
        ...w,
        summary: '',
        startDate: fixDate(w.startDate),
        endDate: fixDate(w.endDate),
      }))
    }

    const selectedTheme = themes[theme] || themes.elegant
    let html = selectedTheme.render(sanitized)

    // Handle async themes
    if (html instanceof Promise) {
      html = await html
    }

    // Remove profile images (not needed for ATS resumes)
    html = html.replace(/<img[^>]*>/gi, '')
    html = html.replace('</head>', '<style>img{display:none!important;}</style></head>')

    // Hide hamburger/nav toggle from elegant theme
    if (theme === 'elegant' || !themes[theme]) {
      html = html.replace('</head>', '<style>.nav-toggle,.navbar-toggle,.hamburger-menu,[class*="toggle"]{display:none!important;}</style></head>')
    }

    return NextResponse.json({ html, theme })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export resume. Please try again.' },
      { status: 500 }
    )
  }
}
