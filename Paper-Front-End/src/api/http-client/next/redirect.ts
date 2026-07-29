import { NextResponse } from 'next/server'

// Under `output: "standalone"`, `request.nextUrl` carries the container's bind
// address (`HOSTNAME:PORT`, e.g. `0.0.0.0:3000`) — Next builds it from that bind
// host, and `x-forwarded-host` does NOT override it. `NextResponse.redirect()`
// then serializes that internal host into an absolute `Location`. Middleware gets
// Next's Location relativization as a safety net, but Route Handlers do not, so an
// absolute redirect there leaks `https://0.0.0.0:3000/...` to the browser.
//
// Emitting a path-relative `Location` sidesteps host resolution entirely: the
// browser resolves it against the real request origin (the public domain). Use
// this for every auth redirect instead of `NextResponse.redirect(nextUrl)`.
export function relativeRedirect(path: string, status = 307): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { Location: path },
  })
}
