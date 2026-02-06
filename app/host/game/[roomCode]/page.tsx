'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Timer } from '@/components/ui/Timer'
import { QuestionCard } from '@/components/game/QuestionCard'
import { AnswerButton } from '@/components/game/AnswerButton'
import { useRoom } from '@/lib/hooks/useRoom'
import { usePlayers } from '@/lib/hooks/usePlayers'
import { useQuestion } from '@/lib/hooks/useQuestion'
import { useTimer } from '@/lib/hooks/useTimer'
import { createClient } from '@/lib/supabase/client'

export default function HostGamePage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading } = useRoom(roomCode)
  const { players, sortedByScore } = usePlayers(room?.id)
  const { currentQuestion, questions } = useQuestion(room)
  const { secondsRemaining, isExpired } = useTimer(room?.question_ends_at || null)
  
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Verify host identity
  useEffect(() => {
    const storedRoomId = localStorage.getItem(`host_${roomCode}`)
    if (!roomLoading && room && storedRoomId !== room.id) {
      router.push(`/play/game/${roomCode}`)
    }
  }, [room, roomCode, roomLoading, router])

  // Redirect when game ends
  useEffect(() => {
    if (room?.status === 'finished') {
      router.push(`/host/results/${roomCode}`)
    }
  }, [room?.status, roomCode, router])

  // Show results when timer expires
  useEffect(() => {
    if (isExpired && !showResults) {
      setShowResults(true)
    }
  }, [isExpired, showResults])

  const handleNextQuestion = async () => {
    if (!room) return
    
    setIsAdvancing(true)
    setShowResults(false)
    
    try {
      const supabase = createClient()
      const nextIndex = room.current_q_index + 1
      
      if (nextIndex >= (room.question_count || 0)) {
        // Game over
        await supabase
          .from('rooms')
          .update({ status: 'finished' })
          .eq('id', room.id)
      } else {
        // Next question
        const questionEndsAt = new Date(Date.now() + 10000).toISOString()
        await supabase
          .from('rooms')
          .update({
            current_q_index: nextIndex,
            question_ends_at: questionEndsAt,
          })
          .eq('id', room.id)
      }
    } catch (err) {
      console.error('Failed to advance question:', err)
    } finally {
      setIsAdvancing(false)
    }
  }

  if (roomLoading || !room || !currentQuestion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </main>
    )
  }

  const totalQuestions = room.question_count || questions.length

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with timer */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Host View &middot; {roomCode}
          </div>
          <Timer seconds={secondsRemaining} />
        </div>

        {/* Question */}
        <Card variant="elevated" className="py-8">
          <QuestionCard
            question={currentQuestion}
            questionNumber={room.current_q_index + 1}
            totalQuestions={totalQuestions}
          />
        </Card>

        {/* Answer options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentQuestion.options.map((option, index) => (
            <AnswerButton
              key={index}
              index={index}
              text={option}
              isCorrect={index === currentQuestion.correct_index}
              showResult={showResults}
              disabled={true}
            />
          ))}
        </div>

        {/* Controls & Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next button */}
          <Card variant="outlined" className="flex flex-col justify-center">
            {showResults ? (
              <Button
                onClick={handleNextQuestion}
                className="w-full"
                size="lg"
                isLoading={isAdvancing}
              >
                {room.current_q_index + 1 >= totalQuestions ? 'Show Results' : 'Next Question'}
              </Button>
            ) : (
              <div className="text-center text-gray-500">
                Waiting for timer to end...
              </div>
            )}
          </Card>

          {/* Mini leaderboard */}
          <Card variant="outlined">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Top Players</h3>
            <div className="space-y-1">
              {sortedByScore.slice(0, 5).map((player, index) => (
                <div key={player.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-gray-400">{index + 1}.</span>
                    <span className="font-medium">{player.name}</span>
                  </span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-sm text-gray-400">No players</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
