import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { CacheRequestConfig } from 'axios-cache-interceptor'

import type { AuthEndpoints } from './endpoints'

type RetryableRequestConfig = InternalAxiosRequestConfig & Pick<CacheRequestConfig, 'cache'>

type AuthInterceptorOptions = {
  onUnauthorized?: () => void
  // Server-side clients pass `true`: a refresh executed during an RSC render can
  // never persist the new Set-Cookie to the browser, so attempting it is wasteful
  // and masks the canonical recovery path (the proxy/recovery route). Let the 401
  // surface instead so the caller can redirect to the recovery handler.
  skipRefresh?: boolean
  // Auth API paths. Required — passed through from the factory's `auth` config.
  authEndpoints: AuthEndpoints
}

let refreshPromise: Promise<void> | null = null

function isAuthEndpoint(url: string | undefined, endpoints: AuthEndpoints): boolean {
  if (!url) return false
  return url.includes(endpoints.refresh) || url.includes(endpoints.login)
}

async function performRefresh(client: AxiosInstance, refreshEndpoint: string): Promise<void> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      // Send an empty JSON object so axios sets a valid body alongside
      // its default Content-Type: application/json header. The API reads
      // the refresh token from cookies, not the body, but Fastify v5
      // requires the Content-Type and body to be consistent.
      await client.post(refreshEndpoint, {}, { ignoredErrors: '*' })
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export function registerAuthInterceptor(
  client: AxiosInstance,
  { onUnauthorized, skipRefresh, authEndpoints }: AuthInterceptorOptions,
): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.withCredentials = true
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status
      const config = error.config as RetryableRequestConfig | undefined

      if (status !== 401 || !config) return Promise.reject(error)
      if (config._retried) return Promise.reject(error)
      if (isAuthEndpoint(config.url, authEndpoints)) return Promise.reject(error)

      if (skipRefresh) {
        onUnauthorized?.()
        return Promise.reject(error)
      }

      try {
        await performRefresh(client, authEndpoints.refresh)
        config._retried = true
        // The original request may have left its cache entry in `loading` state
        // (axios-cache-interceptor). Reusing the same `config` for this retry would
        // make it await that entry's deferred, which only resolves once this very
        // retry settles — a deadlock. `override` forces a fresh cache entry instead.
        if (config.cache) {
          config.cache = { ...config.cache, override: true }
        }
        return client.request(config)
      } catch (refreshErr) {
        onUnauthorized?.()
        return Promise.reject(refreshErr instanceof Error ? refreshErr : error)
      }
    },
  )
}
