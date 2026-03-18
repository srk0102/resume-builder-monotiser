'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import GeneratePageContent from '../page-content'

export default function GenerateWithIdPage() {
  const [initialData, setInitialData] = useState<{ resume: any; jd: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function loadGeneration() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/signin'); return }

      const { data: gen } = await supabase
        .from('generations')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (!gen) {
        router.push('/dashboard')
        return
      }

      try {
        const resume = JSON.parse(gen.resume_text)
        setInitialData({ resume, jd: gen.job_description })
      } catch {
        router.push('/dashboard')
        return
      }
      setLoading(false)
    }
    loadGeneration()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <GeneratePageContent initialResume={initialData?.resume} initialJd={initialData?.jd || ''} />
}
