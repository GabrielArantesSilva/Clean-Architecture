import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

// Generic, contract-agnostic per-request options layered onto axios.

export type IgnoredErrors = string[] | '*'

export interface RequestConfig {
  /** Suppress the automatic error toast for matching errors ('*' = all).  */
  ignoredErrors?: IgnoredErrors
  /** Skip the response-contract unwrap and receive the raw axios response.  */
  skipEnvelopeUnwrap?: boolean
  /** Internal: marks a request already retried after a token refresh.  */
  _retried?: boolean
  // NOTE: per-request CACHING is opt-in via the axios-cache-interceptor `cache`
  // option (e.g. `client.get(url, { cache: { enabled: true } })`). It is NOT
  // declared here on purpose: its type comes from the client being an
  // `AxiosCacheInstance` (see `client.ts` → `setupCache`), so it's already typed
  // on every call. Caching is opt-out by default — omit `cache` and nothing is cached.
}

declare module 'axios' {
  interface AxiosRequestConfig extends RequestConfig {}
  interface InternalAxiosRequestConfig extends RequestConfig {}
}

export type { AxiosRequestConfig, InternalAxiosRequestConfig }
