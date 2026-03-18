import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || ''
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
const MODEL_CONTEXT_LIMIT = 131072

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}

async function callAI(messages: any[], maxTokens: number) {
  const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  })

  const data = await resp.json()
  if (!resp.ok || data.error) {
    console.error('Together AI error:', data.error)
    throw new Error('Resume generation failed. Please try again.')
  }

  return data.choices?.[0]?.message?.content || ''
}

function cleanAIResponse(text: string): string {
  return text
    .replace(/^.*?here\s+(is|are)\s+(the|a|my|your).*?[:\.]\s*\n*/gim, '')
    .replace(/\n*(I\s+(made|did|have)|The\s+(improved|above|resume))[\s\S]*$/gi, '')
    .replace(/\n*(?:please\s+)?note:[\s\S]*$/gi, '')
    .trim()
}

// Group skills into categories for JSON Resume schema
function groupSkills(skills: string[]): any[] {
  const categories: Record<string, string[]> = {
    'Languages': [],
    'Frontend': [],
    'Backend': [],
    'Cloud & DevOps': [],
    'Databases': [],
    'AI/ML': [],
    'Other': [],
  }

  const categoryMap: Record<string, string> = {
    'python': 'Languages', 'java': 'Languages', 'go (golang)': 'Languages', 'c': 'Languages', 'typescript': 'Languages', 'javascript': 'Languages',
    'react.js': 'Frontend', 'vue.js': 'Frontend', 'angular.js': 'Frontend', 'material-ui': 'Frontend', 'bootstrap': 'Frontend', 'thymeleaf': 'Frontend', 'react dnd': 'Frontend', 'konva.js': 'Frontend',
    'node.js': 'Backend', 'express.js': 'Backend', 'fastify': 'Backend', 'spring boot': 'Backend', 'spring mvc': 'Backend', 'spring security': 'Backend', 'spring webflux': 'Backend', 'spring batch': 'Backend', 'spring data jpa': 'Backend', 'spring cloud stream': 'Backend', 'spring cache': 'Backend', 'spring email': 'Backend',
    'docker': 'Cloud & DevOps', 'kubernetes': 'Cloud & DevOps', 'aws s3': 'Cloud & DevOps', 'aws ec2': 'Cloud & DevOps', 'aws lambda': 'Cloud & DevOps', 'aws ses': 'Cloud & DevOps', 'azure app services': 'Cloud & DevOps', 'google cloud run': 'Cloud & DevOps', 'jenkins': 'Cloud & DevOps', 'github actions': 'Cloud & DevOps', 'gitlab ci/cd': 'Cloud & DevOps',
    'mongodb': 'Databases', 'postgresql': 'Databases', 'elasticsearch': 'Databases', 'redis': 'Databases', 'memcached': 'Databases',
    'tensorflow': 'AI/ML', 'pytorch': 'AI/ML', 'hugging face transformers': 'AI/ML',
    'rabbitmq': 'Backend', 'apache kafka': 'Backend', 'google pub/sub': 'Backend',
  }

  const unique = [...new Set(skills.map(s => s.trim()))].filter(Boolean)

  for (const skill of unique) {
    const cat = categoryMap[skill.toLowerCase()] || 'Other'
    categories[cat].push(skill)
  }

  return Object.entries(categories)
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({
      name,
      level: '',
      keywords: items
    }))
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: creditData } = await supabase
      .from('credits')
      .select('remaining_credits')
      .eq('user_id', user.id)
      .single()

    const remainingCredits = creditData?.remaining_credits || 0
    if (remainingCredits <= 0) {
      return NextResponse.json({ error: 'No credits remaining. Purchase more credits to continue.' }, { status: 402 })
    }

    const { jd, descLength } = await request.json()

    if (!jd) {
      return NextResponse.json({ error: 'Job description required' }, { status: 400 })
    }

    const isLong = descLength === 'long'

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile || !userProfile.name || !userProfile.experiences?.length) {
      return NextResponse.json({ error: 'Please complete your profile first.' }, { status: 400 })
    }

    // Deduct credit upfront - blocks if no credits
    const { data: deducted } = await supabase.rpc('deduct_credit', { p_user_id: user.id })
    if (!deducted) {
      return NextResponse.json({ error: 'No credits remaining. Purchase more credits to continue.' }, { status: 402 })
    }

    const profile = {
      name: userProfile.name,
      title: userProfile.title || '',
      email: userProfile.email || user.email || '',
      phone: userProfile.phone || '',
      location: userProfile.location || '',
      experiences: userProfile.experiences || [],
      education: userProfile.education || [],
      skills: userProfile.skills || []
    }

    console.log(`=== GENERATING RESUME for ${profile.name} (${profile.experiences.length} exp, long=${isLong}) ===`)

    // Step 1: Extract JD keywords
    const jdTrimmed = jd.length > 4000 ? jd.substring(0, 4000) : jd
    const keywords = cleanAIResponse(await callAI([{
      role: 'user',
      content: `Extract the 20 most important skills, technologies, and requirements from this job description. Return ONLY a comma-separated list.\n\n${jdTrimmed}`
    }], 150))
    console.log('Keywords:', keywords.substring(0, 100))

    // Step 2: Generate summary
    const summaryRaw = await callAI([{
      role: 'system',
      content: 'You are a professional resume writer. Output ONLY what is asked. No preamble, no labels, no explanations.'
    }, {
      role: 'user',
      content: `Write a 3-sentence professional summary for ${profile.name}, ${profile.title}. They have worked at: ${profile.experiences.map((e: any) => `${e.role} at ${e.company}`).join(', ')}. Their skills include: ${profile.skills.slice(0, 20).join(', ')}. Target role keywords: ${keywords}. Output ONLY the summary paragraph.`
    }], 200)
    const summary = cleanAIResponse(summaryRaw)

    // Step 3: Tailor each experience's bullets individually
    const workEntries: any[] = []

    for (let i = 0; i < profile.experiences.length; i++) {
      const exp = profile.experiences[i]
      let highlights: string[] = []

      if (exp.context && exp.context.trim().length >= 20) {
        try {
          const contextTrimmed = exp.context.length > 3000 ? exp.context.substring(0, 3000) : exp.context
          const bulletCount = isLong ? '6-10' : '3-5'

          const raw = await callAI([{
            role: 'system',
            content: `You are a resume bullet point writer. Output ONLY bullet points starting with "- ". No preamble, no headers, no explanations, no "Here are" text. Just the bullet points.`
          }, {
            role: 'user',
            content: `Rewrite these responsibilities as ${bulletCount} ATS-optimized resume bullet points for the role of ${exp.role} at ${exp.company}.

Original:
${contextTrimmed}

Target keywords: ${keywords}

Rules:
- Start each with a strong action verb
- Keep ALL specific technologies, metrics, and details from the original
- Naturally weave in relevant target keywords
- Do NOT invent information not in the original
- Output ONLY "- " bullet points, nothing else`
          }], isLong ? 1500 : 800)

          const cleaned = cleanAIResponse(raw)
          highlights = cleaned
            .split('\n')
            .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
            .filter((line: string) => line.length > 15 && !line.toLowerCase().startsWith('here'))

          console.log(`  ✓ ${exp.role} @ ${exp.company}: ${highlights.length} bullets`)
        } catch (err) {
          console.error(`  ✗ ${exp.role} @ ${exp.company}:`, err)
          highlights = exp.context.split(/\r?\n+/).filter((l: string) => l.trim().length > 10).slice(0, isLong ? 8 : 4)
        }
      } else {
        console.log(`  - ${exp.role} @ ${exp.company}: skipped (no context)`)
      }

      workEntries.push({
        name: exp.company || '',
        position: exp.role || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate === 'Present' ? '' : (exp.endDate || ''),
        summary: highlights.slice(0, 3).join('. ') + (highlights.length > 0 ? '.' : ''),
        highlights
      })
    }

    // Step 4: Build JSON Resume object (standard schema)
    const locationParts = (profile.location || '').split(',')

    const jsonResume = {
      basics: {
        name: profile.name,
        label: profile.title,
        email: profile.email,
        phone: profile.phone,
        summary,
        location: {
          city: locationParts[0]?.trim() || '',
          region: locationParts[1]?.trim() || '',
          countryCode: ''
        },
        profiles: [] as any[]
      },
      work: workEntries,
      education: (profile.education || []).map((edu: any) => ({
        institution: edu.school || '',
        studyType: edu.degree?.split(',')[0]?.trim() || edu.degree || '',
        area: edu.degree?.split(',').slice(1).join(',').trim() || '',
        startDate: '',
        endDate: edu.year?.toString() || ''
      })),
      skills: groupSkills(profile.skills || [])
    }

    // Save to database
    await supabase.from('generations').insert({
      user_id: user.id,
      job_description: jd,
      description_length: descLength,
      resume_text: JSON.stringify(jsonResume),
      resume_metadata: { model: MODEL },
      status: 'completed'
    })

    console.log('=== DONE ===')
    return NextResponse.json({ jsonResume })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: 'Something went wrong generating your resume. Please try again.' },
      { status: 500 }
    )
  }
}
