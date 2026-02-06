'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/lib/supabase/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function usePlayers(roomId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      return
    }

    const supabase = createClient()
    let channel: RealtimeChannel | null = null
    let mounted = true

    async function fetchPlayers() {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId!)
        .order('created_at', { ascending: true })

      if (mounted) {
        setPlayers(data || [])
        setIsLoading(false)
      }
    }

    fetchPlayers()

    // Subscribe to player changes
    channel = supabase
      .channel(`players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as Player])
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Player).id ? (payload.new as Player) : p
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) =>
              prev.filter((p) => p.id !== (payload.old as Player).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [roomId])

  // Sort by score descending for leaderboard
  const sortedByScore = [...players].sort((a, b) => b.score - a.score)

  return { players, sortedByScore, isLoading }
}
