import type { Room, Player, Question } from '@/lib/supabase/types'

// Game state for UI
export interface GameState {
  room: Room | null
  players: Player[]
  currentQuestion: Question | null
  isLoading: boolean
  error: string | null
}

// Quiz generation request/response
export interface GenerateQuizRequest {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
}

export interface GeneratedQuestion {
  text: string
  options: [string, string, string, string]
  correctIndex: number
}

export interface GenerateQuizResponse {
  questions: GeneratedQuestion[]
}

// Player answer submission
export interface SubmitAnswerResult {
  success: boolean
  isCorrect: boolean
  pointsAwarded: number
}

// Leaderboard entry
export interface LeaderboardEntry {
  playerId: string
  name: string
  score: number
  rank: number
  isWinner: boolean
}
