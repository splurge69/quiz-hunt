'use client'

interface TimerProps {
  seconds: number
  maxSeconds?: number
  size?: 'sm' | 'md' | 'lg'
}

export function Timer({ seconds, maxSeconds = 10, size = 'md' }: TimerProps) {
  const percentage = (seconds / maxSeconds) * 100
  const isUrgent = seconds <= 3
  
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-lg', stroke: 3 },
    md: { container: 'w-20 h-20', text: 'text-3xl', stroke: 4 },
    lg: { container: 'w-28 h-28', text: 'text-4xl', stroke: 5 },
  }
  
  const { container, text, stroke } = sizes[size]
  const radius = 45
  const circumference = 2 * Math.PI * radius

  return (
    <div className={`relative ${container}`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          className={`transition-all duration-100 ${
            isUrgent ? 'text-red-500' : 'text-indigo-600'
          }`}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${text} font-bold ${
        isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-900'
      }`}>
        {seconds}
      </div>
    </div>
  )
}
