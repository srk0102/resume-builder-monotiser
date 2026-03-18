import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// JSON Resume themes
const themes: Record<string, any> = {
  elegant: require('jsonresume-theme-elegant'),
  stackoverflow: require('jsonresume-theme-stackoverflow'),
  kendall: require('jsonresume-theme-kendall'),
  flat: require('jsonresume-theme-flat'),
  macchiato: require('jsonresume-theme-macchiato'),
  class: require('jsonresume-theme-class'),
  onepage: require('jsonresume-theme-onepage'),
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

    // Render with selected theme
    const selectedTheme = themes[theme] || themes.elegant
    let html = selectedTheme.render(jsonResume)

    // Remove all images from themed HTML (no profile pics in resumes)
    html = html.replace(/<img[^>]*>/gi, '')
    html = html.replace('</head>', '<style>img{display:none!important;}</style></head>')

    // Inject CSS fixes for broken themes
    if (theme === 'class') {
      const classFixCSS = `<style>
        /* Override class theme's broken float-based skills layout */
        #skills {
          overflow: visible !important;
        }
        #skills .item,
        #languages .item,
        #interests .item {
          float: none !important;
          width: auto !important;
          display: inline-block !important;
          vertical-align: top !important;
          min-width: 140px !important;
          max-width: 280px !important;
          margin-right: 24px !important;
          margin-bottom: 10px !important;
        }
        #skills .item h3 {
          font-size: 14px !important;
          margin-bottom: 4px !important;
          margin-top: 0 !important;
        }
        #skills .item ul {
          padding-left: 20px !important;
          margin: 0 !important;
        }
        #skills .item ul li {
          font-size: 13px !important;
          line-height: 1.5 !important;
        }
      </style>`
      html = html.replace('</head>', classFixCSS + '</head>')
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
