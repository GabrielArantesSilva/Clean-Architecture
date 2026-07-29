import type { AxiosError } from 'axios'

export function shouldIgnoreError(error: AxiosError, message: string): boolean {
  const ignored = error.config?.ignoredErrors
  if (!ignored) return false
  if (ignored === '*') return true
  return ignored.some((pattern) => message.includes(pattern))
}
