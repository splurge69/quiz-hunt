import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Quiz Hunt
          </h1>
          <p className="text-gray-600 text-lg">
            Real-time multiplayer trivia
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <Card variant="elevated" className="hover:scale-[1.02] transition-transform">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Host a Quiz</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Create an AI-generated quiz and invite players
                </p>
              </div>
              <Link href="/host/create" className="block">
                <Button className="w-full" size="lg">
                  Create Quiz
                </Button>
              </Link>
            </div>
          </Card>

          <Card variant="elevated" className="hover:scale-[1.02] transition-transform">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Join a Quiz</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter a room code to join an existing game
                </p>
              </div>
              <Link href="/join" className="block">
                <Button variant="secondary" className="w-full" size="lg">
                  Join Game
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          Powered by AI-generated questions
        </p>
      </div>
    </main>
  )
}
