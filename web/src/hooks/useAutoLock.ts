import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const LOCK_AFTER_MS = 30 * 60 * 1000
const WARN_BEFORE_MS = 2 * 60 * 1000

export function useAutoLock() {
  const navigate = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(WARN_BEFORE_MS / 1000))

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isWarningRef = useRef(false)
  const navigateRef = useRef(navigate)

  // keep navigateRef current without causing re-runs
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  const clearAllTimers = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const lock = useCallback(() => {
    clearAllTimers()
    sessionStorage.removeItem('masterPassword')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    setShowWarning(false)
    isWarningRef.current = false
    navigateRef.current('/login?reason=auto_locked')
  }, [clearAllTimers])

  const startCountdown = useCallback(() => {
    setShowWarning(true)
    isWarningRef.current = true
    setSecondsLeft(Math.floor(WARN_BEFORE_MS / 1000))
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [])

  const resetTimers = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)
    isWarningRef.current = false
    warnTimerRef.current = setTimeout(startCountdown, LOCK_AFTER_MS - WARN_BEFORE_MS)
    lockTimerRef.current = setTimeout(lock, LOCK_AFTER_MS)
  }, [clearAllTimers, startCountdown, lock])

  const stayLoggedIn = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      if (isWarningRef.current) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(resetTimers, 500)
    }

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetTimers()

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity))
      clearAllTimers()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [resetTimers, clearAllTimers])

  return { showWarning, secondsLeft, stayLoggedIn, lock }
}