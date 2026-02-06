'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Leaderboard } from '@/components/game/Leaderboard'
import { useRoom } from '@/lib/hooks/useRoom'
import { usePlayers } from '@/lib/hooks/usePlayers'

// Hook to safely read localStorage on client
function useLocalStorage(key: string): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem(key),
    () => null
  )
}

export default function HostResultsPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading } = useRoom(roomCode)
  const { players, sortedByScore } = usePlayers(room?.id)
  const playerId = useLocalStorage(`player_${roomCode}`)

  // Verify host identity
  useEffect(() => {
    const storedRoomId = localStorage.getItem(`host_${roomCode}`)
    if (!roomLoading && room && storedRoomId !== room.id) {
      router.push(`/play/results/${roomCode}`)
    }
  }, [room, roomCode, roomLoading, router])

  if (roomLoading || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </main>
    )
  }

  // Find winners
  const topScore = sortedByScore[0]?.score ?? 0
  const winners = sortedByScore.filter(p => p.score === topScore)
  const isTie = winners.length > 1

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Game Over!</h1>
          <p className="text-gray-500">
            {room.prompt} &middot; {room.question_count} questions
          </p>
        </div>

        {/* Winner announcement */}
        <Card variant="elevated" className="text-center py-8 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
          <div className="space-y-3">
            <div className="text-6xl">🏆</div>
            <h2 className="text-2xl font-bold text-yellow-900">
              {isTie ? 'Joint Winners!' : 'Winner!'}
            </h2>
            <div className="space-y-1">
              {winners.map(winner => (
                <p key={winner.id} className="text-xl font-semibold text-yellow-800">
                  {winner.name}
                </p>
              ))}
            </div>
            <p className="text-yellow-700">
              {topScore.toLocaleString()} points
            </p>
          </div>
        </Card>

        {/* Full leaderboard */}
        <Card variant="outlined">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Standings</h3>
          <Leaderboard players={players} highlightPlayerId={playerId || undefined} />
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/host/create" className="block">
            <Button className="w-full" size="lg">
              Host Another Quiz
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
