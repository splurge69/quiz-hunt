'use client'

interface AnswerButtonProps {
  index: number
  text: string
  isSelected?: boolean
  isCorrect?: boolean
  showResult?: boolean
  disabled?: boolean
  onClick?: () => void
}

const colorClasses = [
  { base: 'bg-red-500 hover:bg-red-600', selected: 'bg-red-700 ring-4 ring-red-300', correct: 'bg-red-500', wrong: 'bg-red-900/50' },
  { base: 'bg-blue-500 hover:bg-blue-600', selected: 'bg-blue-700 ring-4 ring-blue-300', correct: 'bg-blue-500', wrong: 'bg-blue-900/50' },
  { base: 'bg-yellow-500 hover:bg-yellow-600', selected: 'bg-yellow-700 ring-4 ring-yellow-300', correct: 'bg-yellow-500', wrong: 'bg-yellow-900/50' },
  { base: 'bg-green-500 hover:bg-green-600', selected: 'bg-green-700 ring-4 ring-green-300', correct: 'bg-green-500', wrong: 'bg-green-900/50' },
]

const labels = ['A', 'B', 'C', 'D']

export function AnswerButton({ 
  index, 
  text, 
  isSelected = false, 
  isCorrect = false,
  showResult = false,
  disabled = false, 
  onClick 
}: AnswerButtonProps) {
  const colors = colorClasses[index]
  
  let className = `w-full p-4 md:p-6 rounded-xl text-white font-semibold text-lg md:text-xl 
    transition-all duration-200 flex items-center gap-4 text-left`
  
  if (showResult) {
    if (isCorrect) {
      className += ` ${colors.base} ring-4 ring-white/50`
    } else if (isSelected) {
      className += ` ${colors.wrong} opacity-60`
    } else {
      className += ` ${colors.wrong} opacity-40`
    }
  } else if (isSelected) {
    className += ` ${colors.selected}`
  } else if (disabled) {
    className += ` ${colors.base} opacity-50 cursor-not-allowed`
  } else {
    className += ` ${colors.base} cursor-pointer active:scale-[0.98]`
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || showResult}
      className={className}
    >
      <span className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold shrink-0">
        {labels[index]}
      </span>
      <span className="flex-1">{text}</span>
      {showResult && isCorrect && (
        <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {showResult && isSelected && !isCorrect && (
        <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}
