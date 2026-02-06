'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook to track answers for the current question in real-time.
 * Returns the count of answers submitted for this question.
 */
export function useAnswers(roomId: string | undefined, questionIndex: number | undefined) {
  const [answerCount, setAnswerCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const currentQuestionIndexRef = useRef<number | undefined>(questionIndex)

  useEffect(() => {
    if (!roomId || questionIndex === undefined) {
      setAnswerCount(0)
      setIsLoading(false)
      currentQuestionIndexRef.current = questionIndex
      return
    }

    const supabase = createClient()
    let channel: RealtimeChannel | null = null
    let mounted = true
    currentQuestionIndexRef.current = questionIndex

    async function fetchAnswerCount() {
      try {
        const { count, error } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId!)
          .eq('q_index', questionIndex!)

        if (error) {
          console.error('Error fetching answer count:', error)
        }

        if (mounted && currentQuestionIndexRef.current === questionIndex) {
          setAnswerCount(count || 0)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch answer count:', err)
        if (mounted && currentQuestionIndexRef.current === questionIndex) {
          setIsLoading(false)
        }
      }
    }

    fetchAnswerCount()

    // Subscribe to new answers
    channel = supabase
      .channel(`answers:${roomId}:${questionIndex}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Only count if it's for the current question and component is still mounted
          if (mounted && currentQuestionIndexRef.current === questionIndex) {
            const newAnswer = payload.new as { q_index: number }
            if (newAnswer.q_index === questionIndex) {
              setAnswerCount((prev) => prev + 1)
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Channel successfully subscribed
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to answers channel')
          if (mounted && currentQuestionIndexRef.current === questionIndex) {
            setIsLoading(false)
          }
        }
      })

    return () => {
      mounted = false
      currentQuestionIndexRef.current = undefined
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [roomId, questionIndex])

  return { answerCount, isLoading }
}
