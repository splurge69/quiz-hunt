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
    () => () => {}, // No-op subscribe since localStorage doesn't change externally
    () => localStorage.getItem(key),
    () => null // Server snapshot
  )
}

export default function PlayerResultsPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading } = useRoom(roomCode)
  const { players, sortedByScore } = usePlayers(room?.id)
  const playerId = useLocalStorage(`player_${roomCode}`)

  // Redirect if no player ID stored
  useEffect(() => {
    if (!playerId) {
      router.push('/join')
    }
  }, [playerId, router])

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

  // Find winners and current player
  const topScore = sortedByScore[0]?.score ?? 0
  const winners = sortedByScore.filter(p => p.score === topScore)
  const isTie = winners.length > 1
  const currentPlayer = players.find(p => p.id === playerId)
  const playerRank = sortedByScore.findIndex(p => p.id === playerId) + 1
  const isWinner = currentPlayer && winners.some(w => w.id === currentPlayer.id)

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Game Over!</h1>
          <p className="text-gray-500">
            {room.prompt}
          </p>
        </div>

        {/* Personal result */}
        {currentPlayer && (
          <Card 
            variant="elevated" 
            className={`text-center py-6 ${
              isWinner 
                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200'
                : ''
            }`}
          >
            <div className="space-y-2">
              {isWinner ? (
                <>
                  <div className="text-5xl">🏆</div>
                  <h2 className="text-2xl font-bold text-yellow-900">
                    {isTie ? 'You\'re a Joint Winner!' : 'You Won!'}
                  </h2>
                </>
              ) : (
                <>
                  <div className="text-5xl">
                    {playerRank <= 3 ? ['🥇', '🥈', '🥉'][playerRank - 1] : '🎮'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {playerRank === 2 ? '2nd Place!' : playerRank === 3 ? '3rd Place!' : `${playerRank}${getOrdinalSuffix(playerRank)} Place`}
                  </h2>
                </>
              )}
              <p className="text-lg text-gray-600">
                <span className="font-bold text-2xl text-indigo-600">{currentPlayer.score.toLocaleString()}</span> points
              </p>
            </div>
          </Card>
        )}

        {/* Winner announcement (if not the current player) */}
        {!isWinner && winners.length > 0 && (
          <Card variant="outlined" className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">
              {isTie ? 'Winners' : 'Winner'}
            </p>
            <p className="font-semibold text-gray-900">
              {winners.map(w => w.name).join(' & ')}
            </p>
            <p className="text-sm text-gray-500">
              {topScore.toLocaleString()} points
            </p>
          </Card>
        )}

        {/* Full leaderboard */}
        <Card variant="outlined">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Standings</h3>
          <Leaderboard players={players} highlightPlayerId={playerId || undefined} />
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/join" className="block">
            <Button className="w-full" size="lg">
              Join Another Game
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
