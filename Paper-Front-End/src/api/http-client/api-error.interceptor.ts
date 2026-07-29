import type { AxiosError, AxiosInstance } from 'axios'
import { toast } from 'sonner'

import { shouldIgnoreError } from './ignored-errors'

const NETWORK_ERROR_MESSAGE = 'Erro de conexão. Verifique sua internet e tente novamente.'
const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente novamente em instantes.'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function resolveMessage(error: AxiosError): string {
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return NETWORK_ERROR_MESSAGE
  }
  if (typeof error.message === 'string' && error.message.length > 0) {
    return error.message
  }
  return GENERIC_ERROR_MESSAGE
}

export function registerApiErrorInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const message = resolveMessage(error)
      if (!shouldIgnoreError(error, message) && isBrowser()) {
        toast.error(message)
      }
      return Promise.reject(error)
    },
  )
}
