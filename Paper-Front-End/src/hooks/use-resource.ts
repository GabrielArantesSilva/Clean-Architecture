'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useLoadingDelay } from './use-loading-delay'

type Options<T> = {
  /** Função que retorna o recurso. Deve estar memoizada (useCallback) — mudanças de identidade disparam reload. */
  action: () => Promise<T>
  /** Quando false, não carrega automaticamente. Default: true. */
  enabled?: boolean
}

export function useResource<T>({ action, enabled = true }: Options<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)

  const actionRef = useRef(action)
  const activeRequestRef = useRef(0)

  const { isLoading, start, stop } = useLoadingDelay()

  const nextRequestId = () => {
    activeRequestRef.current = activeRequestRef.current + 1
    return activeRequestRef.current
  }

  const isActiveRequest = (requestId: number) => activeRequestRef.current === requestId

  const reload = useCallback(async () => {
    const requestId = nextRequestId()

    start()

    let result: T | null = null
    let error: unknown = null

    try {
      result = await actionRef.current()
    } catch (err) {
      error = err
      result = null
    }

    if (!isActiveRequest(requestId)) return

    setData(result)
    setError(error)
    stop()
  }, [start, stop])

  useEffect(() => {
    if (!enabled) return
    reload()
  }, [enabled, reload, action])

  return {
    data,
    isLoading,
    error,
    reload,
    setData,
  }
}
