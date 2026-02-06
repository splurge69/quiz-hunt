'use client'

import type { Question } from '@/lib/supabase/types'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
        Question {questionNumber} of {totalQuestions}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {question.text}
      </h2>
    </div>
  )
}
