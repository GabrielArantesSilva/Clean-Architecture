export type RefreshTokensResult = {
  /** Raw Set-Cookie headers from the API response, ready to forward to the browser */
  setCookieHeaders: string[]
}

export type RefreshTokensOptions = {
  baseURL: string
  refreshTokenCookieName: string
  refreshTokenValue: string
  /** Refresh endpoint path (required — no built-in default). */
  refreshEndpoint: string
}

// Edge-runtime safe. Uses native fetch (no axios) so it can be called from
// middleware or Route Handlers. Returns null on any failure — callers should
// treat null as "session is unrecoverable, log out".
//
// Contract-agnostic: it never parses the response body, so it doesn't care which
// API contract (use-case-core or other) is in use. It relies only on the kit's
// auth model — auth lives in httpOnly cookies — so a successful refresh is one
// that comes back 2xx AND issues new session cookies. A contract that answers a
// failed refresh with a 2xx + error body emits no Set-Cookie, so it's still
// correctly treated as a failure.
export async function refreshTokens(
  options: RefreshTokensOptions,
): Promise<RefreshTokensResult | null> {
  try {
    const res = await fetch(`${options.baseURL}${options.refreshEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${options.refreshTokenCookieName}=${options.refreshTokenValue}`,
      },
      body: '{}'
    })
    if (!res.ok) return null

    const setCookieHeaders = res.headers.getSetCookie()
    if (setCookieHeaders.length === 0) return null

    return { setCookieHeaders }
  } catch {
    return null
  }
}
