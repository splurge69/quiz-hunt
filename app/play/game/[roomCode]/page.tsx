'use client'

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Timer } from '@/components/ui/Timer'
import { QuestionCard } from '@/components/game/QuestionCard'
import { AnswerButton } from '@/components/game/AnswerButton'
import { useRoom } from '@/lib/hooks/useRoom'
import { usePlayers } from '@/lib/hooks/usePlayers'
import { useQuestion } from '@/lib/hooks/useQuestion'
import { useTimer } from '@/lib/hooks/useTimer'
import { useAnswers } from '@/lib/hooks/useAnswers'
import { createClient } from '@/lib/supabase/client'

// Hook to safely read localStorage on client
function useLocalStorage(key: string): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem(key),
    () => null
  )
}

export default function PlayerGamePage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading } = useRoom(roomCode)
  const { players } = usePlayers(room?.id)
  const { currentQuestion, questions } = useQuestion(room)
  const { secondsRemaining, isExpired } = useTimer(room?.question_ends_at || null)
  const { answerCount } = useAnswers(room?.id, room?.current_q_index)
  
  const playerId = useLocalStorage(`player_${roomCode}`)
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [showResults, setShowResults] = useState(false)

  // Check if all players have answered
  const allPlayersAnswered = players.length > 0 && answerCount >= players.length

  // Redirect if no player ID
  useEffect(() => {
    if (!playerId && !roomLoading) {
      router.push('/join')
    }
  }, [playerId, roomLoading, router])

  // Reset selection when question changes
  useEffect(() => {
    if (room?.current_q_index !== undefined) {
      if (!answeredQuestions.has(room.current_q_index)) {
        setSelectedAnswer(null)
        setLastResult(null)
        setShowResults(false)
      }
    }
  }, [room?.current_q_index, answeredQuestions])

  // Redirect when game ends or is cancelled
  useEffect(() => {
    if (room?.status === 'finished') {
      router.push(`/play/results/${roomCode}`)
    } else if (room?.status === 'cancelled') {
      router.push('/join?error=cancelled')
    }
  }, [room?.status, roomCode, router])

  // Show results when timer expires OR all players answered
  useEffect(() => {
    if ((isExpired || allPlayersAnswered) && !showResults) {
      setShowResults(true)
    }
  }, [isExpired, allPlayersAnswered, showResults])

  const handleSubmitAnswer = useCallback(async (answerIndex: number) => {
    if (!room || !playerId || selectedAnswer !== null || isSubmitting) return
    
    setSelectedAnswer(answerIndex)
    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      
      const isCorrect = answerIndex === currentQuestion?.correct_index
      const points = isCorrect ? Math.floor(secondsRemaining * 10) : 0
      
      const { error } = await supabase
        .from('answers')
        .insert({
          room_id: room.id,
          player_id: playerId,
          q_index: room.current_q_index,
          selected_index: answerIndex,
          is_correct: isCorrect,
          points_awarded: points,
        })
      
      if (error) {
        console.error('Answer submission error:', error)
      } else if (points > 0) {
        const { data: player } = await supabase
          .from('players')
          .select('score')
          .eq('id', playerId)
          .single()
        
        if (player) {
          await supabase
            .from('players')
            .update({ score: player.score + points })
            .eq('id', playerId)
        }
      }
      
      setLastResult({ isCorrect, points })
      setAnsweredQuestions(prev => new Set(prev).add(room.current_q_index))
    } catch (err) {
      console.error('Failed to submit answer:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [room, playerId, selectedAnswer, isSubmitting, currentQuestion, secondsRemaining])

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
  const hasAnswered = selectedAnswer !== null

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with timer */}
        <div className="flex items-center justify-center">
          <Timer seconds={secondsRemaining} size="lg" />
        </div>

        {/* Question */}
        <Card variant="elevated" className="py-6">
          <QuestionCard
            question={currentQuestion}
            questionNumber={room.current_q_index + 1}
            totalQuestions={totalQuestions}
          />
        </Card>

        {/* Answer options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, index) => (
            <AnswerButton
              key={index}
              index={index}
              text={option}
              isSelected={selectedAnswer === index}
              isCorrect={index === currentQuestion.correct_index}
              showResult={showResults}
              disabled={hasAnswered || showResults}
              onClick={() => handleSubmitAnswer(index)}
            />
          ))}
        </div>

        {/* Status feedback */}
        {hasAnswered && !showResults && (
          <Card variant="outlined" className="text-center py-4">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-lg font-semibold text-gray-900">Answer locked in!</p>
            <p className="text-sm text-gray-500">
              {allPlayersAnswered ? 'All players answered!' : `Waiting for others... (${answerCount}/${players.length})`}
            </p>
          </Card>
        )}

        {/* Result feedback */}
        {showResults && (
          <Card variant={lastResult?.isCorrect ? 'elevated' : 'outlined'} className="text-center py-4">
            {lastResult ? (
              lastResult.isCorrect ? (
                <div className="text-green-600">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-xl font-bold">Correct!</p>
                  <p className="text-gray-600">+{lastResult.points} points</p>
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="text-4xl mb-2">😔</div>
                  <p className="text-xl font-bold">Wrong</p>
                  <p className="text-gray-600">The correct answer is highlighted</p>
                </div>
              )
            ) : (
              <div className="text-gray-600">
                <div className="text-4xl mb-2">⏱️</div>
                <p className="text-xl font-bold">Time&apos;s up!</p>
                <p className="text-gray-600">You didn&apos;t answer this question</p>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-4">Waiting for next question...</p>
          </Card>
        )}
      </div>
    </main>
  )
}
