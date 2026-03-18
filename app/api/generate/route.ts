import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || ''
const MODEL_MAIN = 'Qwen/Qwen3-235B-A22B-Instruct-2507-FP8'  // $0.20/$0.60 per M tokens - summary + bullets
const MODEL_CHEAP = 'meta-llama/Meta-Llama-3-8B-Instruct-Lite' // $0.10/$0.10 per M tokens - keyword extraction

async function callAI(model: string, messages: any[], maxTokens: number) {
  const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
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

// Parse the batched AI response into per-experience highlights
function parseBatchedResponse(raw: string, experienceCount: number): { summary: string, experiences: string[][] } {
  const cleaned = cleanAIResponse(raw)

  // Extract summary (between [SUMMARY] and [EXP_0] or first [EXP_])
  const summaryMatch = cleaned.match(/\[SUMMARY\]\s*([\s\S]*?)(?=\[EXP_\d+\]|$)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : ''

  // Extract each experience section
  const experiences: string[][] = []
  for (let i = 0; i < experienceCount; i++) {
    const pattern = new RegExp(`\\[EXP_${i}\\]\\s*([\\s\\S]*?)(?=\\[EXP_\\d+\\]|$)`)
    const match = cleaned.match(pattern)
    if (match) {
      const bullets = match[1]
        .split('\n')
        .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
        .filter((line: string) => line.length > 15 && !line.toLowerCase().startsWith('here'))
      experiences.push(bullets)
    } else {
      experiences.push([])
    }
  }

  return { summary, experiences }
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

    // ========================================
    // CALL 1: Extract JD keywords (cheap 8B model, $0.10/M tokens)
    // ========================================
    const jdTrimmed = jd.length > 4000 ? jd.substring(0, 4000) : jd
    const keywords = cleanAIResponse(await callAI(MODEL_CHEAP, [{
      role: 'user',
      content: `Extract the 20 most important skills, technologies, and requirements from this job description. Return ONLY a comma-separated list.\n\n${jdTrimmed}`
    }], 150))
    console.log('Keywords (8B):', keywords.substring(0, 100))

    // ========================================
    // CALL 2: Generate summary + ALL experience bullets in ONE call (70B model)
    // 128K context window, 16K max output — plenty of room
    // ========================================
    const experiencesWithContext = profile.experiences.map((exp: any, i: number) => {
      if (exp.context && exp.context.trim().length >= 20) {
        const contextTrimmed = exp.context.length > 3000 ? exp.context.substring(0, 3000) : exp.context
        return `[EXP_${i}] ${exp.role} at ${exp.company} (${exp.startDate || '?'} - ${exp.endDate || 'Present'})\n${contextTrimmed}`
      }
      return `[EXP_${i}] ${exp.role} at ${exp.company} (${exp.startDate || '?'} - ${exp.endDate || 'Present'})\nNo details provided.`
    }).join('\n\n')

    const bulletRules = isLong
      ? `For EACH experience, write exactly 5-6 ATS-optimized bullet points:
- Start each with a strong action verb
- Keep ALL specific technologies, metrics, and details from the original
- Naturally weave in relevant target keywords
- Do NOT invent information not in the original`
      : `For EACH experience, write 1-2 concise bullet points:
- Combine related work into single impactful statements
- Group technologies by category (say "frontend frameworks" not "React, Angular, Vue", say "cloud platforms" not "AWS, GCP, Azure")
- Only mention 1-2 MOST important specific technologies if they match target keywords
- Keep metrics and measurable impact
- Each bullet should be max 1.5 lines
- Do NOT invent information not in the original`

    // Estimate output tokens needed: summary (~100) + per experience (long: ~150, short: ~60)
    const maxOutputTokens = 200 + profile.experiences.length * (isLong ? 200 : 100)

    const batchedPrompt = `You are a professional resume writer. Generate a resume summary and tailored bullet points for ALL experiences below.

CANDIDATE: ${profile.name}, ${profile.title}
SKILLS: ${profile.skills.slice(0, 25).join(', ')}
TARGET KEYWORDS: ${keywords}

OUTPUT FORMAT (follow EXACTLY):
[SUMMARY]
Write a 3-sentence professional summary paragraph.

${profile.experiences.map((_: any, i: number) => `[EXP_${i}]\n- bullet point 1\n- bullet point 2${isLong ? '\n- bullet point 3\n- bullet point 4\n- bullet point 5' : ''}`).join('\n\n')}

RULES:
${bulletRules}
- Output ONLY the sections above with their markers. No preamble, no explanations, no headers besides the markers.
- Each bullet starts with "- "
- For experiences with "No details provided", write 1 generic bullet based on the role title.

EXPERIENCES:
${experiencesWithContext}`

    console.log(`Batched prompt: ~${Math.ceil(batchedPrompt.length / 4)} input tokens, max ${maxOutputTokens} output tokens`)

    const batchedRaw = await callAI(MODEL_MAIN, [{
      role: 'system',
      content: 'You are a professional resume writer. Follow the output format EXACTLY. Use the section markers [SUMMARY], [EXP_0], [EXP_1], etc. Output ONLY what is asked.'
    }, {
      role: 'user',
      content: batchedPrompt
    }], maxOutputTokens)

    const parsed = parseBatchedResponse(batchedRaw, profile.experiences.length)
    console.log(`Parsed: summary=${parsed.summary.length > 0 ? 'yes' : 'NO'}, experiences=${parsed.experiences.map(e => e.length).join(',')}`)

    // Build work entries from parsed response
    const workEntries: any[] = []
    for (let i = 0; i < profile.experiences.length; i++) {
      const exp = profile.experiences[i]
      let highlights = parsed.experiences[i] || []

      // Limit bullets per mode
      highlights = highlights.slice(0, isLong ? 6 : 2)

      // Fallback: if AI returned nothing, use raw context
      if (highlights.length === 0 && exp.context && exp.context.trim().length >= 20) {
        highlights = exp.context.split(/\r?\n+/).filter((l: string) => l.trim().length > 10).slice(0, isLong ? 6 : 2)
        console.log(`  ⚠ ${exp.role} @ ${exp.company}: fallback to raw context`)
      } else {
        console.log(`  ✓ ${exp.role} @ ${exp.company}: ${highlights.length} bullets`)
      }

      workEntries.push({
        name: exp.company || '',
        position: exp.role || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate === 'Present' ? '' : (exp.endDate || ''),
        summary: '',
        highlights
      })
    }

    // Build JSON Resume object (standard schema)
    const locationParts = (profile.location || '').split(',')

    const jsonResume = {
      basics: {
        name: profile.name,
        label: profile.title,
        email: profile.email,
        phone: profile.phone,
        summary: parsed.summary || `${profile.name} is an experienced ${profile.title}.`,
        location: {
          city: locationParts[0]?.trim() || '',
          region: locationParts[1]?.trim() || '',
          countryCode: ''
        },
        profiles: [] as any[]
      },
      work: workEntries,
      education: (profile.education || []).map((edu: any) => {
        const year = edu.year?.toString().trim() || ''
        let startDate = ''
        let endDate = ''
        // Handle year ranges like "2023-2025" or "2017-2021"
        const rangeMatch = year.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)
        if (rangeMatch) {
          startDate = rangeMatch[1]
          endDate = rangeMatch[2]
        } else if (/^\d{4}$/.test(year)) {
          endDate = year
        } else if (year) {
          const yearExtract = year.match(/(\d{4})/)
          if (yearExtract) endDate = yearExtract[1]
        }
        return {
          institution: edu.school || '',
          studyType: edu.degree?.split(',')[0]?.trim() || edu.degree || '',
          area: edu.degree?.split(',').slice(1).join(',').trim() || '',
          startDate,
          endDate,
        }
      }),
      skills: groupSkills(profile.skills || [])
    }

    // Save to database
    await supabase.from('generations').insert({
      user_id: user.id,
      job_description: jd,
      description_length: descLength,
      resume_text: JSON.stringify(jsonResume),
      resume_metadata: { model: MODEL_MAIN },
      status: 'completed'
    })

    console.log('=== DONE (2 API calls) ===')
    return NextResponse.json({ jsonResume })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: 'Something went wrong generating your resume. Please try again.' },
      { status: 500 }
    )
  }
}
