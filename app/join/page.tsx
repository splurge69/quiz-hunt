'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const code = roomCode.toUpperCase().trim()

      // Check if room exists and is joinable
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single()

      if (roomError || !room) {
        throw new Error('Room not found. Check your code and try again.')
      }

      if (room.locked || room.status !== 'lobby') {
        throw new Error('This game has already started. You cannot join.')
      }

      // Create player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName.trim(),
          score: 0,
        })
        .select()
        .single()

      if (playerError) {
        throw new Error(playerError.message)
      }

      // Store player ID in localStorage
      localStorage.setItem(`player_${code}`, player.id)

      // Redirect to lobby
      router.push(`/play/lobby/${code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Join a Quiz</h1>
          <p className="text-gray-500 mt-2">Enter the room code to play</p>
        </div>

        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="roomCode"
              label="Room Code"
              placeholder="ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              required
              maxLength={6}
              className="text-center text-2xl font-mono tracking-[0.2em] uppercase"
              disabled={isLoading}
            />

            <Input
              id="playerName"
              label="Your Name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              maxLength={20}
              disabled={isLoading}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={roomCode.length !== 6 || !playerName.trim()}
            >
              Join Game
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
