'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook to track answers for the current question.
 * Uses polling as a reliable fallback since realtime can be flaky.
 */
export function useAnswers(roomId: string | undefined, questionIndex: number | undefined) {
  const [answerCount, setAnswerCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const currentQuestionIndexRef = useRef<number | undefined>(questionIndex)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAnswerCount = useCallback(async () => {
    if (!roomId || questionIndex === undefined) return
    
    try {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('q_index', questionIndex)

      if (error) {
        console.error('Error fetching answer count:', error)
        return
      }

      if (currentQuestionIndexRef.current === questionIndex) {
        setAnswerCount(count || 0)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch answer count:', err)
    }
  }, [roomId, questionIndex])

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

    // Initial fetch
    fetchAnswerCount()

    // Start polling as primary method (every 2 seconds)
    // This is more reliable than realtime for this use case
    pollIntervalRef.current = setInterval(() => {
      if (mounted && currentQuestionIndexRef.current === questionIndex) {
        fetchAnswerCount()
      }
    }, 2000)

    // Also try realtime subscription as a bonus (but don't rely on it)
    try {
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
            if (mounted && currentQuestionIndexRef.current === questionIndex) {
              const newAnswer = payload.new as { q_index: number }
              if (newAnswer.q_index === questionIndex) {
                setAnswerCount((prev) => prev + 1)
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            // Realtime failed, but polling is our backup so this is fine
            console.warn('Realtime subscription failed, using polling fallback')
          }
        })
    } catch {
      // Realtime setup failed, polling will handle it
      console.warn('Could not set up realtime, using polling')
    }

    return () => {
      mounted = false
      currentQuestionIndexRef.current = undefined
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [roomId, questionIndex, fetchAnswerCount])

  return { answerCount, isLoading }
}
