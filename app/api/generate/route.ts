import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || ''

async function callAI(messages: any[], maxTokens = 5000) {
  const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  })

  const data = await resp.json()
  if (!resp.ok || data.error) {
    throw new Error(`AI error: ${data.error?.message || 'Failed'}`)
  }

  return data.choices?.[0]?.message?.content || ''
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { jd, descLength } = await request.json()

    if (!jd) {
      return NextResponse.json({ error: 'Job description required' }, { status: 400 })
    }

    const isLong = descLength === 'long'

    // Get user profile from DB or use default
    let profile = {
      name: 'Your Name',
      title: 'Software Engineer',
      email: user?.email || 'you@example.com',
      phone: '+1 234 567 8900',
      location: 'City, State',
      experiences: [
        {
          company: 'Company A',
          role: 'Senior Developer',
          startDate: '2023-01',
          endDate: 'Present',
          context: 'Built web apps with React, TypeScript, Node.js. Deployed on AWS.'
        },
        {
          company: 'Company B',
          role: 'Developer',
          startDate: '2020-01',
          endDate: '2022-12',
          context: 'Developed APIs with Express and PostgreSQL. Created UIs with React.'
        }
      ],
      education: [{ school: 'University', degree: 'BS Computer Science', year: 2019 }],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS']
    }

    if (user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        profile = {
          name: userProfile.name || profile.name,
          title: userProfile.title || profile.title,
          email: userProfile.email || user.email || profile.email,
          phone: userProfile.phone || profile.phone,
          location: userProfile.location || profile.location,
          experiences: userProfile.experiences || profile.experiences,
          education: userProfile.education || profile.education,
          skills: userProfile.skills || profile.skills
        }
      }
    }

    let tokens = 2000
    profile.experiences.forEach(exp => {
      tokens += isLong ? Math.ceil(exp.context.length / 2) : Math.ceil(exp.context.length / 3)
    })
    const maxTokens = Math.ceil(tokens * 1.2)

    const prompt1 = `Generate ATS-optimized resume in CLEAN MARKDOWN format.

JD: ${jd}

Profile: ${JSON.stringify(profile)}

Requirements:
- Use # for name, ## for sections
- Extract JD keywords naturally into bullets
- ${isLong ? 'Detailed bullets (4-6 per role)' : 'Concise bullets (2-3 per role)'}
- Sections: Summary, Experience, Education, Skills
- Professional, ATS-friendly

Output ONLY the markdown resume:`

    const resume1 = await callAI([{ role: 'user', content: prompt1 }], maxTokens)

    const critique = await callAI([{
      role: 'user',
      content: `Review resume, give 3 improvements:\n${resume1}`
    }], 300)

    const final = await callAI([{
      role: 'user',
      content: `Improve this markdown resume:\n\nOriginal:\n${resume1}\n\nFeedback:\n${critique}\n\nOutput ONLY improved markdown resume:`
    }], maxTokens)

    // Save to database if user is logged in
    if (user) {
      await supabase.from('generations').insert({
        user_id: user.id,
        job_description: jd,
        description_length: descLength,
        resume_text: final,
        resume_metadata: { model: 'Llama-3-8B', passes: 3, tokens: maxTokens },
        status: 'completed'
      })
    }

    return NextResponse.json({ text: final, metadata: { model: 'Llama-3-8B', passes: 3 } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
