'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlayerList } from '@/components/game/PlayerList'
import { useRoom } from '@/lib/hooks/useRoom'
import { usePlayers } from '@/lib/hooks/usePlayers'

// Hook to safely read localStorage on client
function useLocalStorage(key: string): string | null {
  return useSyncExternalStore(
    () => () => {}, // No-op subscribe since localStorage doesn't change externally
    () => localStorage.getItem(key),
    () => null // Server snapshot
  )
}

export default function PlayerLobbyPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading, error: roomError } = useRoom(roomCode)
  const { players, isLoading: playersLoading } = usePlayers(room?.id)
  const playerId = useLocalStorage(`player_${roomCode}`)

  // Redirect if no player ID stored
  useEffect(() => {
    if (!roomLoading && !playerId) {
      router.push('/join')
    }
  }, [roomLoading, playerId, router])

  // Redirect when game status changes
  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/play/game/${roomCode}`)
    } else if (room?.status === 'finished') {
      router.push(`/play/results/${roomCode}`)
    } else if (room?.status === 'cancelled') {
      router.push('/join?error=cancelled')
    }
  }, [room?.status, roomCode, router])

  if (roomLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Joining lobby...</p>
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
          <Link href="/join">
            <Button>Try Again</Button>
          </Link>
        </Card>
      </main>
    )
  }

  const currentPlayer = players.find((p) => p.id === playerId)
  const safePlayerId = playerId || undefined

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
            Room: {roomCode}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPlayer ? `Welcome, ${currentPlayer.name}!` : 'Lobby'}
          </h1>
          <p className="text-gray-500">
            {room.prompt} &middot; {room.difficulty}
          </p>
        </div>

        <Card variant="elevated" className="text-center py-8">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Waiting for host</h2>
              <p className="text-gray-500 text-sm mt-1">
                The game will start when {room.host_name} is ready
              </p>
            </div>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Players in lobby</h3>
              <span className="text-sm text-gray-500">
                {playersLoading ? '...' : players.length}
              </span>
            </div>
            <PlayerList players={players} highlightPlayerId={safePlayerId} />
          </div>
        </Card>

        <Link href="/" className="block">
          <Button variant="ghost" className="w-full">
            Leave Game
          </Button>
        </Link>
      </div>
    </main>
  )
}
