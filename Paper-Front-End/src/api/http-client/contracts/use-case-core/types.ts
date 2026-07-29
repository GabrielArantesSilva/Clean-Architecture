// Types for the "use-case-core" API response contract: a `{ process, body }`
// envelope. These are specific to that backend — not part of the generic HTTP
// client — and are consumed by the matching `interceptor` in this folder.

export interface ISuccessResponse<T> {
  body: T
  process: 'success'
}

export interface IFailedResponse {
  body: string
  process: 'failed'
}

export type ApiResponse<T> = ISuccessResponse<T> | IFailedResponse

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (value === null || typeof value !== 'object') return false
  const v = value as { process?: unknown; body?: unknown }
  return (v.process === 'success' || v.process === 'failed') && 'body' in v
}

export function isFailedResponse(value: unknown): value is IFailedResponse {
  return isApiResponse(value) && value.process === 'failed' && typeof value.body === 'string'
}
