'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/utils/generateCode'
import type { GenerateQuizResponse } from '@/lib/types/game'
import type { Difficulty, QuestionPack } from '@/lib/supabase/types'

type QuestionSource = 'ai' | string // 'ai' or pack ID

export default function CreateQuizPage() {
  const router = useRouter()
  const [hostName, setHostName] = useState('')
  const [questionSource, setQuestionSource] = useState<QuestionSource>('ai')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questionCount, setQuestionCount] = useState('10')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  
  // Question packs from Supabase
  const [packs, setPacks] = useState<QuestionPack[]>([])
  const [packsLoading, setPacksLoading] = useState(true)

  // Fetch available question packs
  useEffect(() => {
    const supabase = createClient()
    
    async function fetchPacks() {
      const { data } = await supabase
        .from('question_packs')
        .select('*')
        .order('name', { ascending: true })
      
      setPacks(data || [])
      setPacksLoading(false)
    }
    
    fetchPacks()
  }, [])

  const selectedPack = packs.find(p => p.id === questionSource)
  const isUsingPack = questionSource !== 'ai'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const roomCode = generateRoomCode()
      
      let questions: { text: string; options: string[]; correctIndex: number }[]
      let quizTopic: string
      let quizDifficulty: Difficulty
      let quizQuestionCount: number

      if (isUsingPack && selectedPack) {
        // Use questions from pack
        setStatus('Loading question pack...')
        questions = selectedPack.questions
        quizTopic = selectedPack.name
        quizDifficulty = selectedPack.difficulty
        quizQuestionCount = questions.length
      } else {
        // Generate questions via AI
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

        const response: GenerateQuizResponse = await genResponse.json()
        questions = response.questions
        quizTopic = topic
        quizDifficulty = difficulty
        quizQuestionCount = parseInt(questionCount)
      }

      // Create room in Supabase
      setStatus('Creating room...')
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code: roomCode,
          host_name: hostName.trim(),
          status: 'lobby' as const,
          locked: false,
          prompt: quizTopic,
          difficulty: quizDifficulty,
          question_count: quizQuestionCount,
          current_q_index: 0,
        })
        .select()
        .single()

      if (roomError) {
        throw new Error(roomError.message)
      }

      // Insert questions
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

      // Add host as a player
      setStatus('Joining as player...')
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: hostName.trim(),
          score: 0,
        })
        .select()
        .single()

      if (playerError) {
        throw new Error(playerError.message)
      }

      // Store host identity and player ID in localStorage and redirect to lobby
      localStorage.setItem(`host_${roomCode}`, room.id)
      localStorage.setItem(`player_${roomCode}`, player.id)
      router.push(`/host/lobby/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
      setStatus('')
    }
  }

  // Build source options
  const sourceOptions = [
    { value: 'ai', label: 'Generate with AI' },
    ...packs.map(pack => ({
      value: pack.id,
      label: `${pack.name} (${pack.questions.length} questions)`,
    })),
  ]

  const isFormValid = hostName.trim() && (isUsingPack || topic.trim())

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Create a Quiz</h1>
          <p className="text-gray-500 mt-2">Choose a question pack or generate with AI</p>
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

            <Select
              id="questionSource"
              label="Question Source"
              value={questionSource}
              onChange={(e) => setQuestionSource(e.target.value)}
              disabled={isLoading || packsLoading}
              options={packsLoading ? [{ value: 'ai', label: 'Loading packs...' }] : sourceOptions}
            />

            {!isUsingPack && (
              <>
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
              </>
            )}

            {isUsingPack && selectedPack && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <p className="font-medium text-indigo-900">{selectedPack.name}</p>
                {selectedPack.description && (
                  <p className="text-sm text-indigo-700 mt-1">{selectedPack.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-indigo-600">
                  <span>{selectedPack.questions.length} questions</span>
                  <span className="capitalize">{selectedPack.difficulty}</span>
                </div>
              </div>
            )}

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
              disabled={!isFormValid}
            >
              {isUsingPack ? 'Start Quiz' : 'Generate Quiz'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
