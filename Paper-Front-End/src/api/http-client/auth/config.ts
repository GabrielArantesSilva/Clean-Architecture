import { getDefaultBaseURL } from '../client'
import type { AuthEndpoints } from './endpoints'

export type AuthCookieNames = {
  accessToken: string
  refreshToken: string
  isAuthenticated: string
}

export type SessionExpiredReason = {
  key: string
  value: string
}

// App routes (front-end paths) of the auth flow. Plain paths, no query string —
// distinct from `AuthEndpoints` (API paths) and `AuthUrls` (derived URLs).
export type AuthPaths = {
  /** Login screen. */
  login: string
  /** Session-recovery route handler. */
  recover: string
  /** Where to land after a successful login. */
  redirect: string
  /** Routes reachable without authentication. */
  public: string[]
}

// URLs derived from the config (path + query). Never passed in — always computed
// when the auth config is resolved, so callers don't rebuild them by hand.
export type AuthUrls = {
  /** Login path carrying the session-expired reason query. */
  sessionExpiredLogin: string
}

export type AuthConfigInput = {
  cookieNames: AuthCookieNames
  baseURL?: string
  /** Front-end route paths. `login`/`recover`/`redirect` are required (no built-in
   * defaults); `public` is optional and defaults to `[login, recover]`.
   */
  paths: {
    login: string
    recover: string
    redirect: string
    public?: string[]
  }
  /** 
   * API paths the kit calls for login/refresh. Required — there is no built-in
   * default; a consuming project must declare its API contract explicitly.
   */
  authEndpoints: AuthEndpoints
}

export type ResolvedAuthConfig = {
  cookieNames: AuthCookieNames
  baseURL: string
  paths: AuthPaths
  authEndpoints: AuthEndpoints
  sessionExpiredReason: SessionExpiredReason
  urls: AuthUrls
}

// Fixed, non-configurable: the query the kit appends to the login URL when a
// session expires. Lives in the client; not exposed for configuration.
const SESSION_EXPIRED_REASON: SessionExpiredReason = {
  key: 'reason',
  value: 'session_expired',
}

// Resolves the auth policy (cookie names, route paths, API endpoints) into a
// `ResolvedAuthConfig`. Internal to the kit: `createApiClientFactory` calls it and
// exposes the result as `factory.authConfig` — the single place a consuming
// project configures auth. `paths.public` defaults to `[login, recover]`.
export function resolveAuthConfig(input: AuthConfigInput): ResolvedAuthConfig {
  const { login, recover, redirect } = input.paths
  const publicPaths = input.paths.public ?? [login, recover]

  const reasonQuery = `${encodeURIComponent(SESSION_EXPIRED_REASON.key)}=${encodeURIComponent(
    SESSION_EXPIRED_REASON.value
  )}`

  return {
    cookieNames: input.cookieNames,
    baseURL: input.baseURL ?? getDefaultBaseURL(),
    paths: { login, recover, redirect, public: publicPaths },
    authEndpoints: input.authEndpoints,
    sessionExpiredReason: SESSION_EXPIRED_REASON,
    urls: {
      sessionExpiredLogin: `${login}?${reasonQuery}`
    }
  }
}
