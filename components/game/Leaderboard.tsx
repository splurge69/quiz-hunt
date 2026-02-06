'use client'

import type { Player } from '@/lib/supabase/types'

interface LeaderboardProps {
  players: Player[]
  highlightPlayerId?: string
}

export function Leaderboard({ players, highlightPlayerId }: LeaderboardProps) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score)
  
  // Find winners (all players with highest score)
  const topScore = sorted[0]?.score ?? 0
  const winnerIds = new Set(sorted.filter(p => p.score === topScore).map(p => p.id))
  const isTie = winnerIds.size > 1

  const getMedal = (index: number, playerId: string) => {
    if (winnerIds.has(playerId)) return '🥇'
    if (index === 1 || (index > 0 && sorted[index - 1].score !== sorted[index].score && index === 1)) return '🥈'
    if (index === 2 || (index > 0 && index <= 2)) return '🥉'
    return null
  }

  const getRank = (index: number, currentPlayer: Player) => {
    // Handle ties - same score = same rank
    if (index === 0) return 1
    if (sorted[index - 1].score === currentPlayer.score) {
      // Find first player with this score
      const firstWithScore = sorted.findIndex(p => p.score === currentPlayer.score)
      return firstWithScore + 1
    }
    return index + 1
  }

  return (
    <div className="space-y-3">
      {sorted.map((player, index) => {
        const isHighlighted = player.id === highlightPlayerId
        const isWinner = winnerIds.has(player.id)
        const medal = getMedal(index, player.id)
        const rank = getRank(index, player)

        return (
          <div
            key={player.id}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              isWinner
                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300'
                : isHighlighted
                ? 'bg-indigo-100 border-2 border-indigo-300'
                : 'bg-gray-50 border-2 border-transparent'
            }`}
          >
            {/* Rank */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              isWinner
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {medal || rank}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${
                isWinner ? 'text-yellow-900' : isHighlighted ? 'text-indigo-900' : 'text-gray-900'
              }`}>
                {player.name}
                {isHighlighted && <span className="ml-2 text-xs opacity-70">(You)</span>}
              </p>
              {isWinner && (
                <p className="text-xs text-yellow-700 font-medium">
                  {isTie ? 'Joint Winner!' : 'Winner!'}
                </p>
              )}
            </div>

            {/* Score */}
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                isWinner ? 'text-yellow-900' : 'text-gray-900'
              }`}>
                {player.score.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        )
      })}

      {players.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No players in this game
        </div>
      )}
    </div>
  )
}
