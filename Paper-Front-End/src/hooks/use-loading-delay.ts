'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  /** Atraso mínimo antes de exibir o loader — evita flicker em respostas rápidas. */
  showDelay?: number
  /** Tempo mínimo que o loader permanece visível depois de exibido — evita flash. */
  hideDelay?: number
}

export function useLoadingDelay({ showDelay = 30, hideDelay = 150 }: Options = {}) {
  const [isLoading, setIsLoading] = useState(false)

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownAtRef = useRef<number | null>(null)
  const isLoadingRef = useRef(false)

  const start = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    if (showTimerRef.current || isLoadingRef.current) return

    showTimerRef.current = setTimeout(() => {
      isLoadingRef.current = true
      shownAtRef.current = Date.now()
      setIsLoading(true)
      showTimerRef.current = null
    }, showDelay)
  }, [showDelay])

  const stop = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
      return
    }
    if (!isLoadingRef.current) return

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : hideDelay
    const remaining = Math.max(0, hideDelay - elapsed)

    hideTimerRef.current = setTimeout(() => {
      isLoadingRef.current = false
      shownAtRef.current = null
      setIsLoading(false)
      hideTimerRef.current = null
    }, remaining)
  }, [hideDelay])

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  return { isLoading, start, stop }
}
