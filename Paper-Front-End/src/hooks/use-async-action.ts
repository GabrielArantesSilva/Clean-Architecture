'use client'

import { useCallback, useRef } from 'react'

import { useLoadingDelay } from './use-loading-delay'

export type UseAsyncActionOptions<TArgs extends unknown[], TResult> = {
  /** Mensagem de sucesso resolvida após a ação concluir. */
  successMessage?: string | ((result: TResult, ...args: TArgs) => string)
  /** Notificador disparado com a `successMessage` resolvida — injete o toast da aplicação. */
  notify?: (message: string) => void
  /** Callback após sucesso — depois do notify, antes de `run` retornar. */
  onSuccess?: (result: TResult, ...args: TArgs) => void | Promise<void>
  /** Callback após erro. Erros já são exibidos pelo interceptor de API; use isso para limpeza. */
  onError?: (err: unknown, ...args: TArgs) => void | Promise<void>
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TArgs, TResult> = {}
) {
  const { isLoading, start, stop } = useLoadingDelay()

  const actionRef = useRef(action)
  const optionsRef = useRef(options)

  const run = useCallback(async (...args: TArgs): Promise<TResult | undefined> => {
    start()

    try {
      const result = await actionRef.current(...args)
      const opts = optionsRef.current
      if (opts.successMessage) {
        const msg =
          typeof opts.successMessage === 'function'
            ? opts.successMessage(result, ...args)
            : opts.successMessage
        opts.notify?.(msg)
      }
      await opts.onSuccess?.(result, ...args)
      return result
    } catch (err) {
      await optionsRef.current.onError?.(err, ...args)
      return undefined
    } finally {
      stop()
    }
  }, [start, stop])

  return { run, isLoading }
}
