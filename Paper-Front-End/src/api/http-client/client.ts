import axios from 'axios'
import {
  setupCache,
  type AxiosCacheInstance,
  type AxiosStorage,
  type CacheProperties
} from 'axios-cache-interceptor'


import { registerAuthInterceptor } from './auth/auth.interceptor'
import type { AuthEndpoints } from './auth/endpoints'
import { generateKey } from './cache/key-generator'
import { registerUseCaseCoreInterceptor } from './contracts/use-case-core'
import { registerApiErrorInterceptor } from './api-error.interceptor'

export type CreateApiClientOptions = {
  baseURL: string
  onUnauthorized?: () => void
  /**
   * Whether to skip the response-contract adapter (the use-case-core envelope).
   * `false`/omitted: unwrap the envelope so `response.data` is the `body`.
   * `true`: leave raw axios responses untouched. This is a boilerplate: to talk
   * to a *different* API shape, swap which interceptor is registered below (see
   * `contracts/`) — there is no open callback to pass in.
   */
  skipApiContract?: boolean
  /** Default headers sent on every request from this client. Merged with the managed `Cookie` header (which always wins). */
  headers?: Record<string, string>
  /**
   * Global cache defaults (axios-cache-interceptor). Caching is **opt-out**: by
   * default `enabled: false`, so NO request is cached unless it opts in per call
   * with `{ cache: { enabled: true } }`. Use this to tune the project-wide defaults
   * (e.g. `ttl`), without changing the opt-in contract. The kit's own defaults
   * (opt-out, 60s TTL, 2xx-only) are applied first, then merged with this.
   */
  cache?: Partial<CacheProperties & {
    /**
     * Shared cache storage (axios-cache-interceptor). Omit and each client builds its
     * own isolated in-memory store. Pass a single shared instance so every client minted
     * from the same factory shares ONE cache — **browser only**: sharing a store across
     * server-side clients leaks cached responses between users (each carries a different
     * `Cookie`).
     */
    storage: AxiosStorage
  }>
  /** Auth-related wiring, grouped together. */
  auth: {
    /** Auth API paths (login/refresh). Required — no built-in default. */
    authEndpoints: AuthEndpoints
    /** Cookie header to forward on each request (server-side clients). */
    cookieHeader?: string
    /** Disable the interceptor's 401-triggered refresh. Set by server-side clients, which cannot persist refreshed cookies to the browser. */
    skipAuthRefresh?: boolean
  }
}

export function createApiClient(options: CreateApiClientOptions): AxiosCacheInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    withCredentials: true,
    // Default headers first, then the managed Cookie header so the kit's value always wins.
    headers: {
      ...options.headers,
      ...(options.auth.cookieHeader ? { Cookie: options.auth.cookieHeader } : {})
    },
    // Serialize array params as repeated keys without brackets (`status=a&status=b`).
    // The API's querystring parser reads bracketed keys (`status[]`) literally, and the
    // AJV validator (`removeAdditional: 'all'`) then drops them — silently killing array filters.
    paramsSerializer: { indexes: null }
  })

  // Axios runs response interceptors in REGISTRATION order. To get the pipeline:
  //   1. Auth (first to see raw 401 + retry — so a recovered 401 never reaches ApiError)
  //   2. Contract (unwrap the API envelope — use-case-core by default)
  //   3. ApiError (toast + re-throw)
  // we register them in the SAME order. Do NOT reorder without re-reading axios interceptor
  // semantics — flipping this causes the toast to fire on every 401 even when auth recovers.
  registerAuthInterceptor(client, {
    onUnauthorized: options.onUnauthorized,
    skipRefresh: options.auth.skipAuthRefresh,
    authEndpoints: options.auth.authEndpoints
  })

  if (!options.skipApiContract) {
    registerUseCaseCoreInterceptor(client)
  }

  registerApiErrorInterceptor(client)

  return setupCache(client, {
    enabled: false,
    ttl: 60_000,
    interpretHeader: true,
    generateKey,
    cachePredicate: {
      statusCheck: (status: number) => status >= 200 && status < 300
    },
    ...options.cache
  })
}

export function getDefaultBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
}
