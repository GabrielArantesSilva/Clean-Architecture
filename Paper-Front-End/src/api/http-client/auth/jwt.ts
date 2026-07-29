// Edge-runtime safe. Decodes the JWT payload (no signature verification — the
// API still does that) and checks the `exp` claim against the current clock.
// A return value of `false` means: missing, malformed, or expired.
export function isAccessTokenLive(token: string): boolean {
  const [, payloadPart] = token.split('.')
  if (!payloadPart) return false
  try {
    let payload = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    while (payload.length % 4 !== 0) payload += '='
    const decoded = JSON.parse(atob(payload)) as { exp?: unknown }
    if (typeof decoded.exp !== 'number') return false
    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
