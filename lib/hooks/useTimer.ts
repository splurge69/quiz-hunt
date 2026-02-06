'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook that provides a countdown timer based on a target end time.
 * Returns seconds remaining, updating every 100ms for smooth display.
 */
export function useTimer(endTime: string | null) {
  const calculateRemaining = useCallback((et: string | null) => {
    if (!et) return 0
    const endsAt = new Date(et).getTime()
    const now = Date.now()
    return Math.max(0, (endsAt - now) / 1000)
  }, [])

  // Initialize with calculated value
  const [secondsRemaining, setSecondsRemaining] = useState(() => calculateRemaining(endTime))
  const [isExpired, setIsExpired] = useState(() => !endTime || calculateRemaining(endTime) <= 0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Handle null endTime
    if (!endTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting timer when endTime becomes null is valid
      setSecondsRemaining(0)
       
      setIsExpired(true)
      return
    }

    // Reset for new endTime
    const initial = calculateRemaining(endTime)
     
    setSecondsRemaining(initial)
     
    setIsExpired(initial <= 0)

    // Update function that runs in interval
    const updateTimer = () => {
      const remaining = calculateRemaining(endTime)
      setSecondsRemaining(remaining)
      if (remaining <= 0) {
        setIsExpired(true)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    // Start interval for updates
    intervalRef.current = setInterval(updateTimer, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [endTime, calculateRemaining])

  return {
    secondsRemaining: Math.ceil(secondsRemaining),
    fractionalSeconds: secondsRemaining,
    isExpired,
  }
}
