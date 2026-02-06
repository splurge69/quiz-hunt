'use client'

import { useState } from 'react'

interface JoinCodeDisplayProps {
  code: string
}

export function JoinCodeDisplay({ code }: JoinCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="text-center space-y-3">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Join Code
      </p>
      <button
        onClick={handleCopy}
        className="group relative inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
      >
        <span className="text-4xl font-mono font-bold text-white tracking-[0.3em]">
          {code}
        </span>
        <span className="text-white/70 group-hover:text-white transition-colors">
          {copied ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </span>
      </button>
      <p className="text-sm text-gray-400">
        {copied ? 'Copied!' : 'Click to copy'}
      </p>
    </div>
  )
}
