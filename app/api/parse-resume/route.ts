import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { createClient } from '@/lib/supabase/server'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || ''

// AI-powered resume parser with proper prompting
async function parseResumeWithAI(text: string) {
  const prompt = `Extract ALL information from this resume. Return ONLY valid JSON with this structure:

{
  "name": "Full Name",
  "title": "Professional Title/Role",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, State, Country",
  "experiences": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "2024-01",
      "endDate": "Present",
      "context": "Complete description with ALL responsibilities and achievements"
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree and Major",
      "year": "2024"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

Resume text:
${text}

Return ONLY the JSON object. No explanations.`

  try {
    const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    const data = await resp.json()
    if (!resp.ok || data.error) {
      throw new Error(`AI error: ${data.error?.message || 'Failed'}`)
    }

    let aiResponse = data.choices?.[0]?.message?.content || '{}'

    // Clean up the response
    aiResponse = aiResponse
      .replace(/^Here is the extracted JSON:\s*/i, '')
      .replace(/^Here is the JSON:\s*/i, '')
      .replace(/^Here's the JSON:\s*/i, '')
      .replace(/^JSON:\s*/i, '')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Extract JSON object
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      aiResponse = jsonMatch[0]
    }

    return JSON.parse(aiResponse)
  } catch (error: any) {
    console.error('AI parsing error:', error)
    // Return basic structure if AI fails
    return {
      name: '',
      title: '',
      email: text.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || '',
      phone: '',
      location: '',
      experiences: [],
      education: [],
      skills: []
    }
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

    // Extract text from PDF
    const buffer = await file.arrayBuffer()
    let resumeText = ''

    if (file.type === 'application/pdf') {
      const { text } = await extractText(new Uint8Array(buffer))
      resumeText = Array.isArray(text) ? text.join('\n\n') : text
    } else {
      resumeText = new TextDecoder().decode(buffer)
    }

    console.log('=== EXTRACTING RESUME ===')
    console.log('Text length:', resumeText.length, 'characters')

    // Parse resume WITHOUT AI - completely free!
    const parsed = parseResumeText(resumeText)

    console.log('=== PARSED DATA ===')
    console.log('Name:', parsed.name)
    console.log('Email:', parsed.email)
    console.log('Experiences:', parsed.experiences.length)
    console.log('Education:', parsed.education.length)

    // Deduct 1 credit
    await supabase
      .from('profiles')
      .update({ extraction_credits: credits - 1 })
      .eq('id', user.id)

    console.log('✅ Credit deducted. Remaining:', credits - 1)

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Resume parsing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
      { status: 500 }
    )
  }
}
