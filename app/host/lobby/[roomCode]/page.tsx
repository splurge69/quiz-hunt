'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { JoinCodeDisplay } from '@/components/game/JoinCodeDisplay'
import { PlayerList } from '@/components/game/PlayerList'
import { useRoom } from '@/lib/hooks/useRoom'
import { usePlayers } from '@/lib/hooks/usePlayers'
import { createClient } from '@/lib/supabase/client'

export default function HostLobbyPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading, error: roomError } = useRoom(roomCode)
  const { players, isLoading: playersLoading } = usePlayers(room?.id)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verify host identity
  useEffect(() => {
    const storedRoomId = localStorage.getItem(`host_${roomCode}`)
    if (!roomLoading && room && storedRoomId !== room.id) {
      // Not the host, redirect to join page
      router.push(`/play/lobby/${roomCode}`)
    }
  }, [room, roomCode, roomLoading, router])

  // Redirect if game has started
  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/host/game/${roomCode}`)
    } else if (room?.status === 'finished') {
      router.push(`/host/results/${roomCode}`)
    }
  }, [room?.status, roomCode, router])

  const handleStartGame = async () => {
    if (!room || players.length === 0) return
    
    setIsStarting(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Lock the room and start the game
      const questionEndsAt = new Date(Date.now() + 10000).toISOString()
      
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          locked: true,
          current_q_index: 0,
          question_ends_at: questionEndsAt,
        })
        .eq('id', room.id)
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      // Redirect will happen via the useEffect watching room.status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
      setIsStarting(false)
    }
  }

  if (roomLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lobby...</p>
        </div>
      </main>
    )
  }

  if (roomError || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <Card variant="elevated" className="text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Room Not Found</h1>
          <p className="text-gray-500 mb-4">{roomError || 'This room does not exist.'}</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Game Lobby</h1>
          <p className="text-gray-500 mt-1">
            {room.prompt} &middot; {room.difficulty} &middot; {room.question_count} questions
          </p>
        </div>

        <JoinCodeDisplay code={roomCode} />

        <Card variant="elevated">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Players</h2>
              <span className="text-sm text-gray-500">
                {playersLoading ? '...' : players.length} joined
              </span>
            </div>
            
            <PlayerList players={players} />
          </div>
        </Card>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleStartGame}
            className="w-full"
            size="lg"
            isLoading={isStarting}
            disabled={players.length === 0}
          >
            {players.length === 0 ? 'Waiting for players...' : `Start Game (${players.length} players)`}
          </Button>
          
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Cancel Game
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
