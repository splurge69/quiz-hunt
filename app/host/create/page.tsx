'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/utils/generateCode'
import type { GenerateQuizResponse } from '@/lib/types/game'
import type { Difficulty } from '@/lib/supabase/types'

export default function CreateQuizPage() {
  const router = useRouter()
  const [hostName, setHostName] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questionCount, setQuestionCount] = useState('10')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Step 1: Generate questions via AI
      setStatus('Generating questions...')
      const genResponse = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount: parseInt(questionCount),
        }),
      })

      if (!genResponse.ok) {
        const data = await genResponse.json()
        throw new Error(data.error || 'Failed to generate questions')
      }

      const { questions }: GenerateQuizResponse = await genResponse.json()

      // Step 2: Create room in Supabase
      setStatus('Creating room...')
      const supabase = createClient()
      const roomCode = generateRoomCode()

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code: roomCode,
          host_name: hostName.trim(),
          status: 'lobby' as const,
          locked: false,
          prompt: topic,
          difficulty,
          question_count: parseInt(questionCount),
          current_q_index: 0,
        })
        .select()
        .single()

      if (roomError) {
        throw new Error(roomError.message)
      }

      // Step 3: Insert questions
      setStatus('Saving questions...')
      const questionsToInsert = questions.map((q, index) => ({
        room_id: room.id,
        q_index: index,
        text: q.text,
        options: q.options,
        correct_index: q.correctIndex,
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        throw new Error(questionsError.message)
      }

      // Step 4: Store host identity in localStorage and redirect to lobby
      localStorage.setItem(`host_${roomCode}`, room.id)
      router.push(`/host/lobby/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
      setStatus('')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Create a Quiz</h1>
          <p className="text-gray-500 mt-2">Set up your AI-generated trivia game</p>
        </div>

        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="hostName"
              label="Your Name"
              placeholder="Enter your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              required
              maxLength={20}
              disabled={isLoading}
            />

            <Input
              id="topic"
              label="Quiz Topic"
              placeholder="e.g., 90s children's TV shows"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              maxLength={100}
              disabled={isLoading}
            />

            <Select
              id="difficulty"
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              disabled={isLoading}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />

            <Select
              id="questionCount"
              label="Number of Questions"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              disabled={isLoading}
              options={[
                { value: '5', label: '5 questions' },
                { value: '10', label: '10 questions' },
                { value: '15', label: '15 questions' },
                { value: '20', label: '20 questions' },
              ]}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {status && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {status}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={!hostName.trim() || !topic.trim()}
            >
              Generate Quiz
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
