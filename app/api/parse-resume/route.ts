import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || ''
const MODEL_MAIN = 'Qwen/Qwen3-235B-A22B-Instruct-2507-FP8'  // $0.20/$0.60 per M tokens
const MODEL_CHEAP = 'meta-llama/Meta-Llama-3-8B-Instruct-Lite' // $0.10/$0.10 per M tokens

async function callAI(model: string, messages: { role: string; content: string }[], maxTokens = 4000) {
  const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  })

  const data = await resp.json()
  if (!resp.ok || data.error) {
    console.error('Together AI error:', data.error)
    throw new Error('AI processing failed. Please try again.')
  }

  return data.choices?.[0]?.message?.content || ''
}

function cleanJsonResponse(raw: string): string {
  return raw
    .replace(/^[\s\S]*?(?=[\[{])/m, '')
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

function parseJson(raw: string) {
  const cleaned = cleanJsonResponse(raw)
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('No JSON found in response')
}

// Single batched call to extract everything from the resume
async function parseResumeWithAI(text: string) {
  const trimmed = text.length > 12000 ? text.substring(0, 12000) : text

  const prompt = `You are a resume parser. Extract ALL information from this resume into a single JSON object.

CRITICAL RULES:
- Include EVERY work experience, internship, freelance, or volunteer position
- Include EVERY bullet point and responsibility for each position — do NOT summarize
- Include ALL skills, technologies, certifications mentioned anywhere
- Include ALL education entries
- Preserve original wording as closely as possible
- For experience context, join ALL bullet points into one string separated by newlines

Return ONLY valid JSON (no extra text, no markdown):
{
  "name": "Full Name",
  "title": "Professional Title or Current Role",
  "email": "email@example.com",
  "phone": "phone number exactly as written",
  "location": "City, State/Country",
  "experiences": [
    {
      "company": "Company Name",
      "role": "Exact Job Title",
      "startDate": "YYYY-MM or as written",
      "endDate": "YYYY-MM or Present or as written",
      "context": "ALL bullet points and responsibilities for this role, joined with newlines. Include every detail, metric, and technology mentioned."
    }
  ],
  "education": [
    {
      "school": "Full University/Institution Name",
      "degree": "Full Degree Name, Major/Field",
      "year": "Graduation Year"
    }
  ],
  "skills": ["every", "single", "skill", "technology", "tool", "mentioned", "anywhere"]
}

Resume text:
${trimmed}`

  const raw = await callAI(MODEL_MAIN, [
    { role: 'system', content: 'You are a precise resume parser. Output ONLY valid JSON. No explanations, no markdown.' },
    { role: 'user', content: prompt }
  ], 6000)

  const parsed = parseJson(raw)

  return {
    name: parsed.name || '',
    title: parsed.title || '',
    email: parsed.email || text.match(/[\w.\-]+@[\w.\-]+\.\w+/)?.[0] || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    experiences: parsed.experiences || [],
    education: parsed.education || [],
    skills: parsed.skills || [],
    certifications: parsed.certifications || [],
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check extraction credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('extraction_credits')
      .eq('id', user.id)
      .single()

    const credits = profile?.extraction_credits || 0
    if (credits <= 0) {
      return NextResponse.json({
        error: 'No extraction credits remaining. Purchase more credits to continue.'
      }, { status: 402 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer())
    let resumeText = ''

    if (file.type === 'application/pdf') {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const pdfData = await pdfParse(buffer)
      resumeText = pdfData.text
    } else {
      resumeText = new TextDecoder().decode(buffer)
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file. Please try a different file.' }, { status: 400 })
    }

    console.log('=== EXTRACTING RESUME (1 API call) ===')
    console.log('Text length:', resumeText.length, 'characters')

    // Parse resume with AI — single batched call
    const parsed = await parseResumeWithAI(resumeText)

    console.log('=== PARSED DATA ===')
    console.log('Name:', parsed.name)
    console.log('Email:', parsed.email)
    console.log('Experiences:', parsed.experiences.length)
    console.log('Education:', parsed.education.length)
    console.log('Skills:', parsed.skills.length)

    // Deduct 1 credit
    await supabase
      .from('profiles')
      .update({ extraction_credits: credits - 1 })
      .eq('id', user.id)

    console.log('Credit deducted. Remaining:', credits - 1)

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Resume parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse resume. Please try again or use a different file.' },
      { status: 500 }
    )
  }
}
