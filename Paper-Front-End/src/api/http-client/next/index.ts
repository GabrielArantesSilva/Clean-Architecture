// Edge / route-handler entry. Safe to import from middleware (proxy) and Route
// Handlers (recovery) — nothing here touches `next/headers`.
//
// `createServerApiClient` is intentionally NOT re-exported: it depends on
// `next/headers` (`cookies()`), which is server-only and would leak into the
// edge bundle. Import it directly from `./next/server-client` in Server
// Components / RSC.
export { createAuthProxy, DEFAULT_PROXY_MATCHER } from './proxy'
export type { AuthProxyOptions } from './proxy'

export { createSessionRecoveryHandler } from './recover-session'
