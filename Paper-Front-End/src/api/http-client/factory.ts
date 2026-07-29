import type { AxiosCacheInstance, AxiosStorage, CacheProperties } from 'axios-cache-interceptor'

import { resolveAuthConfig, type AuthConfigInput, type ResolvedAuthConfig } from './auth/config'
import { createApiClient } from './client'

// Client-level defaults set ONCE on the factory. `baseURL` and `authEndpoints`
// come from the auth config; `cookieHeader` is per-request (server) so it lives
// in the per-call overrides, not here.
type ApiClientDefaults = {
  /** Default headers for every client this factory mints (merged with the managed `Cookie`). */
  headers?: Record<string, string>
  /** Default 401-exhausted handler. */
  onUnauthorized?: () => void
  /** Skip the response-contract adapter (raw responses). */
  skipApiContract?: boolean
  /** Disable the 401-triggered refresh (server-side clients). */
  skipAuthRefresh?: boolean
  /** Override the baseURL (defaults to the resolved auth config's baseURL). */
  baseURL?: string
  /**
   * Global cache defaults (axios-cache-interceptor). Caching is **opt-out** by
   * default (`enabled: false`); a request caches only when it opts in with
   * `{ cache: { enabled: true } }`. Tune project-wide defaults here (e.g. `ttl`).
   */
  cache?: Partial<CacheProperties & {
    /**
     * Shared cache storage (axios-cache-interceptor). Omit and each client builds its own
     * isolated in-memory store. Pass a single shared instance so every client minted from
     * this factory shares ONE cache — **browser only**: a shared store on the server leaks
     * cached responses between users (each server client carries a different `Cookie`).
     */
    storage: AxiosStorage
  }>
}

// Everything configured once, when the factory is instantiated: the auth policy
// plus the client-level defaults above.
export type ApiClientFactoryConfig = ApiClientDefaults & {
  /** Auth policy. Resolved once and exposed as `factory.authConfig`. */
  auth: AuthConfigInput
}

// Per-call overrides: every client default, all optional, plus the per-request
// `cookieHeader`. Shallow-merged over the factory defaults; `headers` deep-merge.
export type ApiClientOverrides = ApiClientDefaults & {
  /** Cookie header to forward (server-side requests). */
  cookieHeader?: string
}

// The configured factory: call it (optionally with overrides) to mint a client.
// It also carries the resolved auth config so the proxy / recovery handler can
// reuse the exact same policy.
export type ApiClientFactory = {
  (overrides?: ApiClientOverrides): AxiosCacheInstance
  readonly authConfig: ResolvedAuthConfig
}

// Single configuration entry point for the kit. Instantiate once with the auth
// policy + client defaults, then call the result in your services to get a fully
// wired axios client — no need to repeat headers/baseURL/endpoints each time.
//
//   export const apiFactory = createApiClientFactory({
//     auth: { cookieNames: { ... } },
//     headers: { 'X-App': 'kami' },
//   })
//   // browser service:  apiFactory()
//   // server service:   createServerApiClient(apiFactory)   (./next/server-client)
//   // proxy/recovery:    apiFactory.authConfig
export function createApiClientFactory(config: ApiClientFactoryConfig): ApiClientFactory {
  const { auth, ...defaults } = config
  const authConfig = resolveAuthConfig(auth)

  // Default 401-exhausted handler: send the browser to the session-expired login
  // URL. No-op outside the browser (e.g. during RSC), so server clients safely
  // let the 401 surface to the recovery route. Override per-factory or per-call.
  const redirectToLogin = (): void => {
    if (typeof window !== 'undefined') {
      window.location.replace(authConfig.urls.sessionExpiredLogin)
    }
  }

  const factory = (overrides: ApiClientOverrides = {}): AxiosCacheInstance =>
    createApiClient({
      baseURL: overrides.baseURL ?? defaults.baseURL ?? authConfig.baseURL,
      headers: { ...defaults.headers, ...overrides.headers },
      onUnauthorized: overrides.onUnauthorized ?? defaults.onUnauthorized ?? redirectToLogin,
      skipApiContract: overrides.skipApiContract ?? defaults.skipApiContract,
      cache: overrides.cache ?? defaults.cache,
      auth: {
        authEndpoints: authConfig.authEndpoints,
        cookieHeader: overrides.cookieHeader,
        skipAuthRefresh: overrides.skipAuthRefresh ?? defaults.skipAuthRefresh,
      }
    })

  return Object.assign(factory, { authConfig })
}
