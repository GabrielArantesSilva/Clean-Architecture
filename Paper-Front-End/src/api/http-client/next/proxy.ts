import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { ResolvedAuthConfig } from '../auth/config'
import { isAccessTokenLive } from '../auth/jwt'

// Excludes Next internals, static assets, and file-based metadata routes (icons,
// robots, sitemap) from the proxy — none of these should trigger an auth redirect.
export const DEFAULT_PROXY_MATCHER = [
  '/((?!_next/static|_next/image|favicon.ico|icon.svg|icon.png|apple-icon.png|sitemap.xml|robots.txt).*)',
]

export type AuthProxyOptions = {
  // Escape hatch to short-circuit the proxy (e.g. an environment where the API
  // is unreachable from the edge). Returning `true` lets the request through.
  shouldBypass?: (request: NextRequest) => boolean
}

// Builds the Next proxy (the middleware renamed in Next 16). Performs optimistic
// route protection only — full authorization still lives in the API. It never
// refreshes here; an expired/missing access token is handed off to the recovery
// route, the single place that calls the refresh API and emits Set-Cookie.
//
// Redirects here MUST use `NextResponse.redirect(request.nextUrl.clone())`, not a
// raw relative Location: Next's middleware adapter re-parses the Location as an
// absolute `NextURL` (it throws on a relative one) and, when the redirect host
// equals the request host, rewrites it to a path-relative Location before the
// response leaves the process. Under `output: "standalone"` both are the bind
// address (0.0.0.0:3000), so they always match and the browser receives a safe
// relative Location. Route Handlers do NOT get this relativization — see
// `recover-session.ts`, which must emit the relative Location itself.
export function createAuthProxy(config: ResolvedAuthConfig, options: AuthProxyOptions = {}) {
  const { cookieNames, paths, sessionExpiredReason } = config

  function isPublicPath(pathname: string): boolean {
    return paths.public.some((p) => pathname.startsWith(p))
  }

  function redirectToLogin(request: NextRequest, sessionExpired: boolean): NextResponse {
    const url = request.nextUrl.clone()
    url.pathname = paths.login
    url.search = ''
    if (sessionExpired) url.searchParams.set(sessionExpiredReason.key, sessionExpiredReason.value)
    const response = NextResponse.redirect(url)
    response.cookies.delete(cookieNames.isAuthenticated)
    response.cookies.delete(cookieNames.accessToken)
    return response
  }

  function redirectToRecoverSession(request: NextRequest): NextResponse {
    const original = request.nextUrl.pathname + request.nextUrl.search
    const target = request.nextUrl.clone()
    target.pathname = paths.recover
    target.search = ''
    target.searchParams.set('next', original)
    return NextResponse.redirect(target)
  }

  return function proxy(request: NextRequest): NextResponse {
    if (options.shouldBypass?.(request)) {
      return NextResponse.next()
    }

    const { pathname } = request.nextUrl
    const isAuthenticated = request.cookies.get(cookieNames.isAuthenticated)?.value === 'true'

    if (isPublicPath(pathname)) {
      if (isAuthenticated && pathname.startsWith(paths.login)) {
        const url = request.nextUrl.clone()
        url.pathname = paths.redirect
        url.search = ''
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    if (!isAuthenticated) {
      return redirectToLogin(request, pathname !== '/')
    }

    const accessToken = request.cookies.get(cookieNames.accessToken)?.value
    if (accessToken && isAccessTokenLive(accessToken)) {
      return NextResponse.next()
    }

    return redirectToRecoverSession(request)
  }
}
