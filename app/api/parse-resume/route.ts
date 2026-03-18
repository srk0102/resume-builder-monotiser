import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || ''

const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
const MODEL_CONTEXT_LIMIT = 131072

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}

function safeMaxTokens(inputText: string, desired: number) {
  const inputTokens = estimateTokens(inputText)
  const available = MODEL_CONTEXT_LIMIT - inputTokens - 100
  return Math.min(desired, Math.max(available, 500))
}

async function callAI(messages: { role: string; content: string }[], maxTokens = 4000) {
  // Auto-cap max_tokens based on input size
  const inputText = messages.map(m => m.content).join('\n')
  const safeMax = safeMaxTokens(inputText, maxTokens)

  const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.1,
      max_tokens: safeMax,
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
    .replace(/^[\s\S]*?(?=[\[{])/m, '') // strip everything before first [ or {
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

function parseJson(raw: string) {
  const cleaned = cleanJsonResponse(raw)
  // Try to find a JSON object or array
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('No JSON found in response')
}

// Step 1: Extract basic info (name, title, email, phone, location, skills, education)
async function extractBasicInfo(text: string) {
  const prompt = `You are a resume parser. Extract the basic personal information, education, and skills from this resume.

IMPORTANT: Do NOT miss any skills, education entries, or certifications. Include EVERYTHING.

Return ONLY valid JSON (no extra text):
{
  "name": "Full Name",
  "title": "Professional Title or Current Role",
  "email": "email@example.com",
  "phone": "phone number exactly as written",
  "location": "City, State/Country",
  "education": [
    {
      "school": "Full University/Institution Name",
      "degree": "Full Degree Name and Major/Field",
      "year": "Graduation Year"
    }
  ],
  "skills": ["every", "single", "skill", "mentioned", "anywhere", "in", "the", "resume"],
  "certifications": ["any certifications or licenses mentioned"]
}

Resume text:
${text}`

  const raw = await callAI([{ role: 'user', content: prompt }])
  return parseJson(raw)
}

// Step 2: Identify all experiences
async function identifyExperiences(text: string) {
  const prompt = `You are a resume parser. List ALL work experiences/positions from this resume.

For EACH position, return the company name, job title, start date, and end date.
Include internships, freelance work, volunteer work - every position mentioned.

Return ONLY a valid JSON array (no extra text):
[
  {
    "company": "Company Name",
    "role": "Exact Job Title",
    "startDate": "YYYY-MM or as written",
    "endDate": "YYYY-MM or Present or as written"
  }
]

Resume text:
${text}`

  const raw = await callAI([{ role: 'user', content: prompt }])
  return parseJson(raw)
}

// Step 3: Extract full details for each experience one at a time
async function extractExperienceDetails(text: string, company: string, role: string) {
  const prompt = `You are a resume parser. From the resume below, find the position "${role}" at "${company}" and extract the COMPLETE description.

CRITICAL RULES:
- Include EVERY bullet point, responsibility, and achievement for this specific position
- Do NOT summarize or shorten anything - copy the full text word for word
- Include all metrics, numbers, percentages, and specific details mentioned
- If there are technologies mentioned, include them all
- Preserve the original wording as closely as possible

Return ONLY valid JSON (no extra text):
{
  "company": "${company}",
  "role": "${role}",
  "startDate": "start date as written",
  "endDate": "end date as written or Present",
  "context": "The COMPLETE description with ALL bullet points joined. Every single responsibility and achievement, missing nothing."
}

Resume text:
${text}`

  const raw = await callAI([{ role: 'user', content: prompt }], 3000)
  return parseJson(raw)
}

// Main extraction: multi-step approach to capture everything
async function parseResumeWithAI(text: string) {
  // Run basic info and experience identification in parallel
  const [basicInfo, experienceList] = await Promise.all([
    extractBasicInfo(text),
    identifyExperiences(text),
  ])

  console.log(`Found ${experienceList.length} experiences, extracting details for each...`)

  // Extract full details for each experience individually
  const experiences = []
  for (const exp of experienceList) {
    try {
      const details = await extractExperienceDetails(text, exp.company, exp.role)
      experiences.push(details)
      console.log(`  ✓ Extracted: ${exp.role} at ${exp.company}`)
    } catch (err) {
      console.error(`  ✗ Failed to extract ${exp.role} at ${exp.company}:`, err)
      // Fall back to the basic info we already have
      experiences.push({
        company: exp.company,
        role: exp.role,
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        context: '',
      })
    }
  }

  return {
    name: basicInfo.name || '',
    title: basicInfo.title || '',
    email: basicInfo.email || text.match(/[\w.\-]+@[\w.\-]+\.\w+/)?.[0] || '',
    phone: basicInfo.phone || '',
    location: basicInfo.location || '',
    experiences,
    education: basicInfo.education || [],
    skills: basicInfo.skills || [],
    certifications: basicInfo.certifications || [],
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
      // Import the lib directly to skip pdf-parse's test file auto-load
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const pdfData = await pdfParse(buffer)
      resumeText = pdfData.text
    } else {
      resumeText = new TextDecoder().decode(buffer)
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file. Please try a different file.' }, { status: 400 })
    }

    console.log('=== EXTRACTING RESUME ===')
    console.log('Text length:', resumeText.length, 'characters')

    // Parse resume with AI (multi-step for thoroughness)
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
