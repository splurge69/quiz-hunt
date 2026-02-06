'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Room } from '@/lib/supabase/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRoom(roomCode: string) {
  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    async function fetchRoom() {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single()

      if (fetchError) {
        setError(fetchError.message)
        setRoom(null)
      } else {
        setRoom(data)
        setError(null)
      }
      setIsLoading(false)
    }

    fetchRoom()

    // Subscribe to room changes
    channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room)
          } else if (payload.eventType === 'DELETE') {
            setRoom(null)
            setError('Room has been deleted')
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [roomCode])

  return { room, isLoading, error }
}
