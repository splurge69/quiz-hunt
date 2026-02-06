import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { GenerateQuizRequest, GenerateQuizResponse, GeneratedQuestion } from '@/lib/types/game'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuizRequest = await request.json()
    const { topic, difficulty, questionCount } = body

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }
    if (!questionCount || questionCount < 5 || questionCount > 20) {
      return NextResponse.json({ error: 'Question count must be between 5 and 20' }, { status: 400 })
    }

    const difficultyInstructions = {
      easy: 'Questions should be straightforward and suitable for beginners. Use common, well-known facts.',
      medium: 'Questions should be moderately challenging, requiring some knowledge of the topic.',
      hard: 'Questions should be challenging and require deep knowledge or obscure facts about the topic.',
    }

    const systemPrompt = `You are a quiz question generator. Generate exactly ${questionCount} multiple-choice trivia questions about the topic: "${topic}".

${difficultyInstructions[difficulty]}

Requirements:
- Each question must have exactly 4 answer options
- Exactly one option must be correct
- Wrong options should be plausible but clearly incorrect to someone who knows the topic
- Questions should be engaging and educational
- Avoid ambiguous wording
- Do not repeat questions or answers

Respond with a JSON object in this exact format:
{
  "questions": [
    {
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}

The correctIndex is 0-based (0 for first option, 1 for second, etc).
Only respond with valid JSON, no additional text.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${questionCount} ${difficulty} questions about: ${topic}` },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
    }

    let parsed: { questions: GeneratedQuestion[] }
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 })
    }

    // Validate the response structure
    if (!Array.isArray(parsed.questions) || parsed.questions.length !== questionCount) {
      return NextResponse.json({ error: 'Incorrect number of questions generated' }, { status: 500 })
    }

    for (const q of parsed.questions) {
      if (
        typeof q.text !== 'string' ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctIndex !== 'number' ||
        q.correctIndex < 0 ||
        q.correctIndex > 3
      ) {
        return NextResponse.json({ error: 'Invalid question format from AI' }, { status: 500 })
      }
    }

    const response: GenerateQuizResponse = { questions: parsed.questions }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Quiz generation error:', error)
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      )
    }
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
