'use client'

import { useEffect, useState, useCallback, useSyncExternalStore, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { QuestionCard } from '@/components/game/QuestionCard'
import { AnswerButton } from '@/components/game/AnswerButton'
import { useRoom } from '@/lib/hooks/useRoom'
import { usePlayers } from '@/lib/hooks/usePlayers'
import { useQuestion } from '@/lib/hooks/useQuestion'
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

export default function HostGamePage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  
  const { room, isLoading: roomLoading } = useRoom(roomCode)
  const { players, sortedByScore } = usePlayers(room?.id)
  const { currentQuestion, questions } = useQuestion(room)
  const { answerCount: remoteAnswerCount } = useAnswers(room?.id, room?.current_q_index)
  
  const playerId = useLocalStorage(`player_${roomCode}`)
  
  const [showResults, setShowResults] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false)
  
  const isAdvancingRef = useRef(false)

  // Use optimistic count - ensure our own answer is counted even if realtime hasn't updated
  const answerCount = Math.max(remoteAnswerCount, hasSubmittedAnswer ? 1 : 0)
  
  // Check if all players have answered
  const allPlayersAnswered = players.length > 0 && answerCount >= players.length

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

  // Show results when all players have answered
  useEffect(() => {
    if (allPlayersAnswered && !showResults) {
      setShowResults(true)
    }
  }, [allPlayersAnswered, showResults])

  // Reset state when question changes
  useEffect(() => {
    if (room?.current_q_index !== undefined) {
      if (!answeredQuestions.has(room.current_q_index)) {
        setSelectedAnswer(null)
        setLastResult(null)
        setShowResults(false)
        setHasSubmittedAnswer(false)
        isAdvancingRef.current = false
        setIsAdvancing(false)
      }
    }
  }, [room?.current_q_index, answeredQuestions])

  const handleSubmitAnswer = useCallback(async (answerIndex: number) => {
    if (!room || !playerId || selectedAnswer !== null || isSubmitting) return
    
    setSelectedAnswer(answerIndex)
    setIsSubmitting(true)
    setHasSubmittedAnswer(true)
    
    try {
      const supabase = createClient()
      
      const isCorrect = answerIndex === currentQuestion?.correct_index
      const points = isCorrect ? 100 : 0
      
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
        setHasSubmittedAnswer(false)
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
      setHasSubmittedAnswer(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [room, playerId, selectedAnswer, isSubmitting, currentQuestion])

  // Broadcast show results to all players by setting question_ends_at to past
  const handleShowResultsEarly = useCallback(async () => {
    if (!room) return
    
    try {
      const supabase = createClient()
      // Set question_ends_at to a past date to signal "show results"
      await supabase
        .from('rooms')
        .update({
          question_ends_at: new Date(0).toISOString(),
        })
        .eq('id', room.id)
      
      setShowResults(true)
    } catch (err) {
      console.error('Failed to broadcast show results:', err)
    }
  }, [room])

  const handleNextQuestion = useCallback(async () => {
    if (!room || isAdvancingRef.current) return
    
    isAdvancingRef.current = true
    setIsAdvancing(true)
    
    try {
      const supabase = createClient()
      const nextIndex = room.current_q_index + 1
      
      if (nextIndex >= (room.question_count || 0)) {
        await supabase
          .from('rooms')
          .update({ status: 'finished' as const })
          .eq('id', room.id)
        
        router.push(`/host/results/${roomCode}`)
      } else {
        // Clear question_ends_at when moving to next question
        await supabase
          .from('rooms')
          .update({
            current_q_index: nextIndex,
            question_ends_at: null,
          })
          .eq('id', room.id)
      }
    } catch (err) {
      console.error('Failed to advance question:', err)
      isAdvancingRef.current = false
      setIsAdvancing(false)
    }
  }, [room, roomCode, router])

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {roomCode} &middot; {answerCount}/{players.length} answered
          </div>
          {!showResults && answerCount > 0 && !allPlayersAnswered && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShowResultsEarly}
            >
              Show Results Early
            </Button>
          )}
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
            <div className="text-2xl mb-1">✓</div>
            <p className="font-medium text-gray-900">Answer locked in!</p>
            <p className="text-sm text-gray-500">
              {allPlayersAnswered ? 'All players answered!' : `Waiting for others... (${answerCount}/${players.length})`}
            </p>
          </Card>
        )}

        {/* Result feedback with Next Question button */}
        {showResults && (
          <Card variant={lastResult?.isCorrect ? 'elevated' : 'outlined'} className="text-center py-6">
            {lastResult ? (
              lastResult.isCorrect ? (
                <div className="text-green-600">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-bold text-lg">Correct! +{lastResult.points} points</p>
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="text-3xl mb-2">😔</div>
                  <p className="font-bold text-lg">Wrong answer</p>
                </div>
              )
            ) : (
              <div className="text-gray-600">
                <div className="text-3xl mb-2">📊</div>
                <p className="font-bold text-lg">Results</p>
              </div>
            )}
            
            <div className="mt-6">
              <Button
                onClick={handleNextQuestion}
                disabled={isAdvancing}
                isLoading={isAdvancing}
                size="lg"
                className="w-full md:w-auto min-w-[200px]"
              >
                {room.current_q_index + 1 >= totalQuestions 
                  ? 'Show Results' 
                  : 'Next Question'}
              </Button>
            </div>
          </Card>
        )}

        {/* Leaderboard */}
        <Card variant="outlined">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Leaderboard</h3>
          <div className="space-y-1">
            {sortedByScore.slice(0, 5).map((player, index) => (
              <div key={player.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-gray-400">{index + 1}.</span>
                  <span className={`font-medium ${player.id === playerId ? 'text-indigo-600' : ''}`}>
                    {player.name}
                    {player.id === playerId && <span className="text-xs ml-1">(you)</span>}
                  </span>
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
    </main>
  )
}
