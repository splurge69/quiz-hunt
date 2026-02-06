'use client'

import type { Player } from '@/lib/supabase/types'

interface PlayerListProps {
  players: Player[]
  showScores?: boolean
  highlightPlayerId?: string
}

export function PlayerList({ players, showScores = false, highlightPlayerId }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>Waiting for players to join...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
            highlightPlayerId === player.id
              ? 'bg-indigo-100 border-2 border-indigo-300'
              : 'bg-gray-50 border-2 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              highlightPlayerId === player.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {showScores ? index + 1 : player.name.charAt(0).toUpperCase()}
            </div>
            <span className={`font-medium ${
              highlightPlayerId === player.id ? 'text-indigo-900' : 'text-gray-800'
            }`}>
              {player.name}
              {highlightPlayerId === player.id && (
                <span className="ml-2 text-xs text-indigo-600">(You)</span>
              )}
            </span>
          </div>
          {showScores && (
            <span className="font-bold text-lg text-gray-900">
              {player.score.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
