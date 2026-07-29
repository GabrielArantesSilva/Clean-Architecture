// Public, universal (client-safe) surface of the HTTP client. Next-specific code
// lives behind `./next` (edge) and `./next/server-client` (server-only) and is
// intentionally NOT re-exported here, so importing this barrel never pulls
// `next/headers` into a client bundle.

// Client factory — the single configuration entry point (auth + client defaults)
export { createApiClientFactory } from './factory'
export type { ApiClientFactory, ApiClientFactoryConfig, ApiClientOverrides } from './factory'

// Low-level client (the factory builds on this)
export { createApiClient, getDefaultBaseURL } from './client'
export type { CreateApiClientOptions } from './client'
export type { IgnoredErrors, RequestConfig } from './request'

// Cache storage builders (axios-cache-interceptor) — pass to the factory's `storage`
export { createMemoryCacheStorage } from './cache'
export type { CacheStorage } from './cache'

// Response contracts (default: use-case-core envelope)
export { registerUseCaseCoreInterceptor, isApiResponse, isFailedResponse } from './contracts'
export type { ApiResponse, ISuccessResponse, IFailedResponse } from './contracts'

// Auth (types consumed by the proxy/recovery/browser-client; resolution lives in the factory)
export type {
  AuthConfigInput,
  ResolvedAuthConfig,
  AuthCookieNames,
  SessionExpiredReason,
} from './auth/config'
export type { AuthEndpoints } from './auth/endpoints'
export { isAccessTokenLive } from './auth/jwt'
export { refreshTokens } from './auth/refresh'
export type { RefreshTokensOptions, RefreshTokensResult } from './auth/refresh'
