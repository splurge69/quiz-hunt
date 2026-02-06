'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Question, Room } from '@/lib/supabase/types'

export function useQuestion(room: Room | null) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const roomId = room?.id ?? null

  useEffect(() => {
    if (!roomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting state when dependency becomes null is valid
      setQuestions([])
       
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    let mounted = true

    async function fetchQuestions() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', roomId!)
        .order('q_index', { ascending: true })

      if (mounted) {
        setQuestions(data || [])
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    fetchQuestions()

    return () => {
      mounted = false
    }
  }, [roomId])

  // Get current question based on room's current_q_index
  const currentQuestion = useMemo(() => {
    if (!room || questions.length === 0) return null
    return questions.find((q) => q.q_index === room.current_q_index) || null
  }, [room, questions])

  return { questions, currentQuestion, isLoading }
}
