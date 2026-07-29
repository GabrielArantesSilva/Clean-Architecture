import { type NextRequest, type NextResponse } from 'next/server'

import type { ResolvedAuthConfig } from '../auth/config'
import { refreshTokens } from '../auth/refresh'
import { relativeRedirect } from './redirect'

// Builds the "try to refresh; log out if that fails" route handler. This is the
// single entry point reached from the proxy (access token missing/expired) or a
// Server Component (API rejected an apparently-valid token). All cookie mutation
// on the Next side happens here.
//
// Route Handlers don't get Next's Location relativization, and under standalone
// `request.nextUrl` carries the bind host (0.0.0.0:3000), so redirects here are
// path-relative (see `relativeRedirect`) — the browser resolves them against the
// public origin instead of the internal bind address.
export function createSessionRecoveryHandler(config: ResolvedAuthConfig) {
  const { cookieNames, baseURL, paths, urls, authEndpoints } = config

  function loginRedirect(): NextResponse {
    const response = relativeRedirect(urls.sessionExpiredLogin)
    response.cookies.delete(cookieNames.accessToken)
    response.cookies.delete(cookieNames.refreshToken)
    response.cookies.delete(cookieNames.isAuthenticated)
    return response
  }

  function sanitizeNextPath(next: string | null): string {
    if (!next) return paths.redirect
    // Only allow same-origin paths; reject protocol-relative and absolute URLs.
    if (!next.startsWith('/') || next.startsWith('//')) return paths.redirect
    return next
  }

  return async function GET(request: NextRequest): Promise<NextResponse> {
    const refreshToken = request.cookies.get(cookieNames.refreshToken)?.value
    if (!refreshToken) return loginRedirect()

    const refreshed = await refreshTokens({
      baseURL,
      refreshTokenCookieName: cookieNames.refreshToken,
      refreshTokenValue: refreshToken,
      refreshEndpoint: authEndpoints.refresh,
    })

    if (!refreshed) return loginRedirect()

    // `next` may contain a path + query. Normalize it through URL parsing (strips
    // control chars / header-injection attempts) and keep only pathname + search,
    // emitting a path-relative Location so the browser resolves it against the
    // public origin — never the internal bind host from `request.nextUrl`.
    const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'))
    const parsed = new URL(next, request.nextUrl.origin)
    const response = relativeRedirect(`${parsed.pathname}${parsed.search}`)
    for (const header of refreshed.setCookieHeaders) {
      response.headers.append('Set-Cookie', header)
    }
    return response
  }
}
