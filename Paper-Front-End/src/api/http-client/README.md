# http-client

HTTP client + authentication kit for **Next.js (App Router)** apps that talk to a
cookie-based API. It bundles a configured axios instance (response-envelope
unwrap, toast-on-error, automatic token refresh) and the Next.js glue for session
protection — the proxy (middleware), the session-recovery route handler, and the
server-side client — all driven by a single config object.

> This module lives in `src/api/http-client/` and is imported via the
> `@/api/http-client` path alias (see [Setup](#setup)). Kami is the shared template,
> so projects started from it already include this module — there is no package to
> install.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [The default API contract (use-case-core)](#the-default-api-contract-use-case-core)
- [Using another API contract](#using-another-api-contract)
- [Setup](#setup)
- [Layout](#layout)
- [Entry points](#entry-points)
- [Quick start](#quick-start)
- [Features in depth](#features-in-depth)
- [API reference](#api-reference)
- [Customization](#customization)
- [FAQ / gotchas](#faq--gotchas)

---

## Why this exists

A Next App Router app authenticating against an external API has to solve the same
problems every time:

- Unwrap a response envelope (`{ process, body }`) into plain data.
- Show a toast on unexpected errors, but stay silent on errors the caller handles.
- Refresh an expired access token transparently and retry the failed request.
- Protect routes optimistically in the proxy, and recover sessions where cookies
  can actually be written.
- Forward cookies on server-side requests (RSC / route handlers).

This package centralizes all of that behind one config object, so a new app wires
auth **in one place** and the three Next file-convention files become one-liners.

---

## The default API contract (use-case-core)

By **default** the client adapts the **use-case-core** response contract. It is
**not mandatory** — turn it off with `skipApiContract: true` to get raw responses, or
swap it for another contract in code (see
[Using another API contract](#using-another-api-contract)). The response envelope
below is the only contract-specific part; the auth/cookie model is shared by
every contract.

**Response envelope (use-case-core)** — every JSON response is wrapped:

```jsonc
// success
{ "process": "success", "body": { /* ...data... */ } }
// failure
{ "process": "failed",  "body": "human readable error message" }
```

The matching adapter (`registerUseCaseCoreInterceptor`) unwraps a success envelope
so `response.data` is the `body`, and rejects a failed envelope with an `Error`
carrying the `body` message. It lives in `contracts/use-case-core/` (interceptor +
types together), self-contained so another contract can be added as a sibling
folder.

**Auth cookies** — the API sets httpOnly cookies on login/refresh. Their names are
configurable; the defaults expected by the kit are three cookies: an access token,
a refresh token, and an `is-authenticated` flag readable by the proxy.

**Auth endpoints** — **required**, declared on the factory's `auth.authEndpoints`
(there is no built-in default). The interceptor and the refresh helper use them.
The Origami convention is:

| Purpose | Method & path |
| --- | --- |
| Login | `POST /auth/login` |
| Refresh access token | `POST /auth/generate-access-token` |

The refresh endpoint must read the refresh token **from the cookie** and respond
`2xx`, **setting the new session cookies** (`Set-Cookie`). The recovery route keys
off those cookies, not the response body, so refresh works regardless of the
response contract (`refreshTokens` is contract-agnostic).

---

## Using another API contract

This is a **boilerplate**: the contract is chosen in code, not passed in as an
open callback. The `skipApiContract` option is a simple on/off switch for the
default use-case-core adapter.

```ts
import { createApiClient } from '@/api/http-client'

// default — applies the use-case-core envelope adapter
createApiClient({ baseURL })

// raw mode — no envelope unwrap; response.data is the untouched axios payload
createApiClient({ baseURL, skipApiContract: true })
```

To talk to a **different** API shape, add a folder under `contracts/` (its
interceptor + types, mirroring `use-case-core/`) and register it in
`client.ts` in place of `registerUseCaseCoreInterceptor`. The auth and
error/toast interceptors are contract-agnostic and always run; only the contract
adapter in the middle of the pipeline changes.

`apiFactory({ skipApiContract: true })` forwards the same on/off flag per call.

---

## Setup

The module is local TypeScript source under `src/api/http-client/` — no package to
install and no build step. Imports use the `@/` path alias, so the app's
`tsconfig.json` must map it to `src/`:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Peer dependency:** `next` (`^16`). **Runtime deps:** `axios`, `sonner`,
`axios-cache-interceptor` + `object-code` (caching is **opt-in**, so it's inert unless a call
asks for it — see [Caching](#caching-opt-in); `object-code` hashes the request into the
id-prefixed cache key).

> Next 16 renamed `middleware.ts` to `proxy.ts`. On Next < 16 place the proxy code
> in `middleware.ts` instead (same content).

---

## Layout

The **generic axios client lives at the root** (it *is* the package); the feature
layers built on top of it are subfolders — each concern in one place:

```
http-client/
├── index.ts                 # public, universal (client-safe) surface
│                            # — root files = the generic client (no contract, no framework):
├── client.ts                # createApiClient (composition root), getDefaultBaseURL
├── factory.ts               # createApiClientFactory (the single config entry point)
├── request.ts               # per-request options + axios module augmentation
├── api-error.interceptor.ts # generic error toast (sonner)
├── ignored-errors.ts
│
├── contracts/               # pluggable response contracts — one folder each
│   └── use-case-core/       # default: { process, body } envelope (interceptor + types)
├── cache/                   # caching helpers (axios-cache-interceptor)
│   ├── key-generator.ts     # generateKey — id-prefixed cache key (internal; wired in client.ts)
│   └── storage.ts           # createMemoryCacheStorage — shared store + regex-aware remove()
├── auth/                    # auth feature: config, endpoints, interceptor, jwt, refresh
│   ├── config.ts            # resolveAuthConfig (internal; resolved by the factory)
│   ├── endpoints.ts         # AuthEndpoints type (required; no default)
│   ├── auth.interceptor.ts  # 401 → single-flight refresh → retry
│   ├── jwt.ts               # isAccessTokenLive            [edge-safe]
│   └── refresh.ts           # refreshTokens                [edge-safe]
└── next/                    # Next.js-specific code
    ├── proxy.ts             # createAuthProxy              [edge / middleware]
    ├── recover-session.ts   # createSessionRecoveryHandler [route handler]
    └── server-client.ts     # createServerApiClient(factory) [server-only: next/headers]
```

Adding support for another backend shape = drop a new folder under `contracts/`
and register its interceptor in `client.ts` — nothing else moves.

---

## Entry points

The package is split so server-only / Next-routing code never leaks into client
bundles:

| Import | Safe in | Contains |
| --- | --- | --- |
| `@/api/http-client` | anywhere (client/server) | `createApiClientFactory`, `createApiClient`, `isAccessTokenLive`, `refreshTokens`, envelope types |
| `@/api/http-client/next` | proxy & route handlers (`next/server`) | `createAuthProxy`, `createSessionRecoveryHandler`, `DEFAULT_PROXY_MATCHER` |
| `@/api/http-client/next/server-client` | server only (`next/headers`) | `createServerApiClient`, `getServerCookieHeader` |

Do **not** import `/next` or `/next/server-client` from a `'use client'` component.

---

## Quick start

### 1. Instantiate the factory once

`createApiClientFactory` is the **single configuration entry point** — it takes the
auth policy plus the client defaults (headers, `onUnauthorized`, …) and returns a
factory you call in your services. It also exposes `.authConfig` for the proxy and
recovery route.

```ts
// src/core/api/factory.ts
import { createApiClientFactory } from '@/api/http-client'

export const apiFactory = createApiClientFactory({
  // Auth policy (resolved once; reused via apiFactory.authConfig):
  auth: {
    cookieNames: {
      accessToken: '@app:access-token',
      refreshToken: '@app:refresh-token',
      isAuthenticated: '@app:is-authenticated',
    },
    // Front-end routes — required (no built-in defaults). `public` is optional
    // (defaults to [login, recover]).
    paths: { login: '/login', recover: '/auth/recover-session', redirect: '/dashboard' },
    // API paths — required (declare your API contract explicitly).
    authEndpoints: { login: '/auth/login', refresh: '/auth/generate-access-token' },
    // baseURL is optional (defaults to NEXT_PUBLIC_API_URL ?? http://localhost:3000).
  },
  // Client defaults applied to every client this factory mints:
  headers: { 'X-App': 'kami' },
  // onUnauthorized, skipApiContract, skipAuthRefresh, baseURL…
})
// apiFactory.authConfig → ResolvedAuthConfig (paths, urls.sessionExpiredLogin, authEndpoints, …)
// The session-expired reason (?reason=session_expired) is fixed by the kit — not configurable.
```

### 2. Wire the proxy (route protection)

```ts
// src/proxy.ts  (or middleware.ts on Next < 16)
import { createAuthProxy } from '@/api/http-client/next'

import { apiFactory } from '@/core/api/factory'

export const proxy = createAuthProxy(apiFactory.authConfig)

// ⚠️ Next statically parses `config.matcher` at build time and does NOT follow
// imports, so it must be an inline literal — you cannot write
// `matcher: DEFAULT_PROXY_MATCHER`. Copy the value of `DEFAULT_PROXY_MATCHER`
// here (and keep it in sync):
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. Wire the session-recovery route

```ts
// src/app/auth/recover-session/route.ts
import { createSessionRecoveryHandler } from '@/api/http-client/next'

import { apiFactory } from '@/core/api/factory'

export const GET = createSessionRecoveryHandler(apiFactory.authConfig)
```

> The `paths.recover` in your config **must** match this route's path
> (default `/auth/recover-session`).

### 4. Use the factory in components / services

```ts
// client component (browser)
'use client'
import { apiFactory } from '@/core/api/factory'

const client = apiFactory()
const { data } = await client.get('/orders') // data is already the unwrapped body
```

```ts
// Server Component / route handler (forwards cookies, no refresh attempt)
import { createServerApiClient } from '@/api/http-client/next/server-client'

import { apiFactory } from '@/core/api/factory'

const client = await createServerApiClient(apiFactory)
const { data } = await client.get('/users/me')
```

---

## Features in depth

### Response interceptor pipeline

`createApiClient` registers four response interceptors, in this exact order
(axios runs them in registration order):

1. **Auth** — sees the raw `401` first, refreshes, and retries, so a recovered
   request never reaches the error toast. (contract-agnostic)
2. **Contract** — the response adapter. By default the use-case-core one unwraps
   `{ process: 'success', body }` so `response.data` is the `body`, and rejects a
   `{ process: 'failed', body }` (or an HTTP-error response carrying one) with an
   `Error` whose `message` is `body`. Turn it off with `skipApiContract: true`, or
   change it in code (see
   [Using another API contract](#using-another-api-contract)).
3. **Error/toast** — shows `toast.error(message)` (via `sonner`, browser only)
   unless the request opted out with `ignoredErrors`. (contract-agnostic)
4. **Cache** — `axios-cache-interceptor`, registered **last** so it stores the
   already-unwrapped `body` and stays out of Auth's refresh path. It only **appends**
   to the order above. **Opt-out by default** — inert unless a call opts in (see
   [Caching](#caching-opt-in)).

⚠️ Do not reorder 1–3 without re-reading axios interceptor semantics — flipping
them makes the toast fire on 401s that auth would have recovered. Cache must stay
**last** (so it caches the unwrapped body and never the raw envelope).

### Transparent token refresh (browser)

When a request gets a `401`, the auth interceptor calls the refresh endpoint
**once** (concurrent 401s share a single in-flight refresh via a module-level
promise — "single-flight"), then retries the original request once (`config._retried`
guards against loops). Requests to the login/refresh endpoints are never retried.

If the refresh fails, the client's `onUnauthorized` callback runs. The factory
wires this by default to redirect to the session-expired login URL (a no-op
outside the browser); override it via the factory config or a per-call
`onUnauthorized`.

### Why a proxy *and* a recovery route?

Next.js only lets you **write cookies** in the proxy/middleware response, route
handlers, and server actions — **never during a Server Component render**. So:

- The **proxy** does optimistic protection: it checks the `is-authenticated`
  cookie and whether the access token is still live (`isAccessTokenLive`, a local
  `exp` check — no network). If the token is missing/expired it redirects to the
  recovery route. It never refreshes itself.
- The **recovery route** is the single place that calls the refresh API and
  forwards the resulting `Set-Cookie` to the browser. On failure it clears the
  cookies and redirects to login.

### Server-side client skips refresh

`createServerApiClient` sets `skipAuthRefresh: true`. A refresh during an RSC
render could never persist the new cookies to the browser, so the client lets the
`401` surface instead — the caller treats it as "logged out" and the recovery
route handles the real refresh on the next navigation. This keeps refresh
single-sourced.

### Selective error toasts

Pass `ignoredErrors` per request to suppress the automatic toast (e.g. on a form
submit where you render the error inline):

```ts
client.post('/auth/login', payload, { ignoredErrors: '*' })          // suppress all
client.get('/maybe-404', { ignoredErrors: ['not found', 'expired'] }) // substring match on message
```

### Raw responses

Pass `skipEnvelopeUnwrap: true` to receive the untouched axios response (e.g. when
hitting an endpoint that does not use the envelope):

```ts
const res = await client.get('/health', { skipEnvelopeUnwrap: true })
```

### Caching (opt-in)

Response caching is provided by
[`axios-cache-interceptor`](https://axios-cache-interceptor.js.org/) and is **opt-out by
default**: no request is ever cached unless the call explicitly opts in. To cache a call, pass
`cache: { enabled: true }` in its config:

```ts
const client = apiFactory()

client.get('/orders')                                   // NOT cached (default)
client.get('/orders', { cache: { enabled: true } })     // cached for 60s (default TTL)
client.get('/orders', { cache: { enabled: true, ttl: 5 * 60_000 } }) // cached for 5 min

// `response.cached` tells you whether a hit was served from cache:
const res = await client.get('/orders', { cache: { enabled: true } })
res.cached // false on the first call, true on subsequent hits within the TTL
```

> ⚠️ **`enabled: true` is required to opt in.** Because the global default is `enabled: false`,
> passing only `{ cache: { ttl } }` (without `enabled: true`) inherits the disabled default and
> **silently does not cache**. Always include `enabled: true`.

**What gets cached.** Only **successful (2xx)** GET/HEAD responses. The kit narrows
`cachePredicate` to 2xx on purpose: a use-case-core **failure** is delivered as a 4XX/5XX
carrying a `{ process: 'failed' }` body, and the library's *default* predicate would otherwise
cache some of those statuses (`404`, `410`, `501`, …). Narrowing to 2xx guarantees a failure is
**never** cached. The cached value is the already-unwrapped `body` (Cache runs last in the
[pipeline](#response-interceptor-pipeline)), so a hit looks identical to a miss to your code.

**Tuning project-wide defaults.** Pass `cache` to the factory (or `createApiClient`) to change
the global defaults — e.g. a different TTL — without changing the opt-in contract:

```ts
createApiClientFactory({
  auth: { /* … */ },
  cache: { ttl: 30_000 }, // opt-in calls now default to 30s (still opt-out unless enabled)
})
```

**Cache keys (`id` prefix).** The kit installs a custom `generateKey` (in
`cache/key-generator.ts`, wired into `setupCache` — internal, not exported). It strips
leading/trailing slashes off `baseURL`/`url`, hashes the request shape (`url` + `params` +
`method` + `data`, via `object-code`), and **prefixes the request's `id`** to that hash — the key
is `` `${id ?? ''}${hash}` ``. Pass an `id` on the call to give a set of requests a **shared,
predictable key prefix**:

```ts
client.get('/orders', { id: 'orders', cache: { enabled: true } })      // key: "orders<hashA>"
client.get('/orders/42', { id: 'orders', cache: { enabled: true } })   // key: "orders<hashB>"
// same "orders" prefix, different hashes → two distinct entries you can drop together
```

Without an `id` the key is just the hash: entries stay unique per request, but you lose the shared
prefix that makes targeted invalidation (below) possible. Grouping related reads under one `id` is
what lets you evict them as a group after a mutation.

**Sharing one cache across clients.** By default every client the factory mints builds its **own
isolated** in-memory store, so two separate `apiFactory()` calls do **not** share cached entries.
To make them share a single cache, build one store with the kit's **`createMemoryCacheStorage`**
and pass it via the factory's `cache` option:

```ts
import { createApiClientFactory, createMemoryCacheStorage } from '@/api/http-client'

const sharedStorage = createMemoryCacheStorage() // ⚠️ browser only — see the caveat below

export const apiFactory = createApiClientFactory({
  auth: { /* … */ },
  cache: { storage: sharedStorage }, // every client from this factory now shares ONE cache
})
```

`createMemoryCacheStorage` wraps `axios-cache-interceptor`'s `buildMemoryStorage` (forwarding the
same args — `cloneData`, `cleanupInterval`, `maxEntries`, `maxStaleAge`) and adds **regex-aware
`remove()`** (see *Invalidating cached entries* just below). Keep a reference to the instance so
you can invalidate entries later.

**Invalidating cached entries (regex `remove`).** A store from `createMemoryCacheStorage` overrides
`remove()` so its argument is treated as a **regular-expression pattern** matched against every
cache key — not a single exact key id (the library's default). Combined with the `id` prefix above,
one call drops a whole group of entries — e.g. after a write invalidates a list:

```ts
const sharedStorage = createMemoryCacheStorage()
// ... pass it to the factory as shown above ...
const client = apiFactory()

await client.get('/orders', { id: 'orders', cache: { enabled: true } })     // key: "orders…"
await client.get('/orders/42', { id: 'orders', cache: { enabled: true } })  // key: "orders…"

await client.post('/orders', payload)   // mutation — the cached reads are now stale
await sharedStorage.remove('^orders')   // regex: evict EVERY key starting with "orders"
```

> ⚠️ The argument is a **regex**, not a literal id. An `id` containing regex metacharacters
> (`.`, `*`, `(`, `[`, …) is interpreted as a pattern, and `remove('')` — or any catch-all like
> `'.*'` — clears the **whole** store. Anchor with `^` and escape metacharacters when you mean a
> literal prefix.

**Server-side caveat.** `createServerApiClient` mints a **new** client per request, and the
default storage is an in-memory map **bound to that instance** — so a server-side cache lives and
dies within a single request: there is **no cross-user leakage**, but also **no real benefit**.
Caching is meant for the (longer-lived) browser client. **Never** pass a shared/module-level
`storage` (the `cache.storage` option above) to a server client — each server request carries a
*different* `Cookie`, so a shared store *would* serve one user's cached response to another.

### Array query params

The client serializes array params as repeated keys without brackets
(`status=a&status=b`, not `status[]=a`) via `paramsSerializer: { indexes: null }`,
matching APIs whose querystring parser ignores bracketed keys.

---

## API reference

### `@/api/http-client`

- **`createApiClientFactory(config): ApiClientFactory`** — the **single
  configuration entry point**. Takes `auth` (an `AuthConfigInput`, resolved once)
  plus client defaults (`headers`, `onUnauthorized`, `skipApiContract`,
  `skipAuthRefresh`, `baseURL`, `cache`) and returns a factory. Call the factory (optionally
  with per-call overrides — shallow-merge over the defaults; `headers` deep-merge)
  to mint a client; read `factory.authConfig` (a `ResolvedAuthConfig`) from the
  proxy / recovery handler. The minted client is an `AxiosCacheInstance` (a superset of
  `AxiosInstance`), so the per-request `cache` option is typed on every call (see
  [Caching](#caching-opt-in)).

  ```ts
  export const apiFactory = createApiClientFactory({
    auth: { cookieNames: { /* … */ } },
    headers: { 'X-App': 'kami' },
  })
  const a = apiFactory()
  const b = apiFactory({ cookieHeader, headers: { 'X-Trace': '1' } })
  createAuthProxy(apiFactory.authConfig)
  ```
- **`createApiClient(options): AxiosInstance`** — low-level factory that
  `createApiClientFactory` builds on; use it directly only when you don't need the
  shared config. Options: `baseURL`, `onUnauthorized?`, `skipApiContract?`
  (`boolean`, default `false` — set `true` for raw responses), `headers?`
  (`Record<string, string>`, merged with the managed `Cookie`), `cache?`
  (`Partial<CacheProperties>` — global cache defaults; opt-out unless overridden, see
  [Caching](#caching-opt-in)), and `auth`
  (`{ authEndpoints, cookieHeader?, skipAuthRefresh? }` — `authEndpoints` required).
  Returns an `AxiosCacheInstance`.
- **`registerUseCaseCoreInterceptor(client): void`** — the default contract
  interceptor for the `{ process, body }` envelope. Register it (or another
  contract's interceptor) in `client.ts`.
- **`createMemoryCacheStorage(...args): MemoryStorage`** — builds an in-memory cache store to
  share across clients (pass it as the factory's `cache.storage`). Forwards its args to
  `axios-cache-interceptor`'s `buildMemoryStorage` (`cloneData`, `cleanupInterval`, `maxEntries`,
  `maxStaleAge`) and overrides `remove(pattern)` to treat its argument as a **regex** matched
  against every cache key — pair it with a per-request `id` prefix to evict a group of entries in
  one call. **Browser only** (see the [server-side caveat](#caching-opt-in)). See
  [Caching](#caching-opt-in).
- **`getDefaultBaseURL(): string`** — `process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000'`.
- **`isAccessTokenLive(token): boolean`** — edge-safe; decodes the JWT payload
  (no signature check) and tests `exp` against the clock. `false` = missing /
  malformed / expired.
- **`refreshTokens(options): Promise<RefreshTokensResult | null>`** — edge-safe
  refresh via native `fetch`; returns the raw `Set-Cookie` headers, or `null` on
  failure. **Contract-agnostic:** it never parses the body — success is a `2xx`
  response that issues new session cookies.
- **`isApiResponse`, `isFailedResponse`** — use-case-core envelope type guards.
- **Types:** `ApiClientFactory`, `ApiClientFactoryConfig`, `ApiClientOverrides`,
  `CreateApiClientOptions`, `AuthConfigInput`,
  `ResolvedAuthConfig`, `AuthCookieNames`, `SessionExpiredReason`,
  `RefreshTokensOptions`, `RefreshTokensResult`,
  `ApiResponse`, `ISuccessResponse`, `IFailedResponse`, `IgnoredErrors`,
  `RequestConfig`, `CacheStorage` (alias of `axios-cache-interceptor`'s `AxiosStorage`).

### `@/api/http-client/next/server-client`

- **`createServerApiClient(factory, overrides?): Promise<AxiosInstance>`** — builds a
  client from your `apiFactory` (inherits its headers/baseURL/endpoints), forwards
  the incoming request cookies (`next/headers`) and disables refresh by default.
- **`getServerCookieHeader(): Promise<string>`** — serializes all cookies into a
  `Cookie` header string.

### `@/api/http-client/next`

- **`createAuthProxy(config, options?)`** — returns the proxy/middleware function.
  `options.shouldBypass?(request)` lets specific requests through untouched.
- **`createSessionRecoveryHandler(config)`** — returns the `GET` route handler.
- **`DEFAULT_PROXY_MATCHER`** — `['/((?!_next/static|_next/image|favicon.ico).*)']`.
  A reference value to copy into `config.matcher`. Next parses `config.matcher`
  statically and won't follow imports, so it must be an inline literal — do **not**
  write `export const config = { matcher: DEFAULT_PROXY_MATCHER }`.

### Per-request config (extends axios)

```ts
interface RequestConfig {
  ignoredErrors?: string[] | '*'  // suppress error toasts
  skipEnvelopeUnwrap?: boolean    // return the raw axios response
  retried?: boolean               // internal: refresh-retry guard
}
```

---

## Customization

- **Cookie names / paths / redirect:** all via the factory's `auth` config — no code edits.
- **Response contract:** disable the default envelope adapter with `skipApiContract: true`
  (raw responses) — no code edits. To adopt a *different* contract, register its
  interceptor in `client.ts` (see
  [Using another API contract](#using-another-api-contract)). The default adapter
  and its types are isolated in `contracts/use-case-core/`, separate from the
  contract-agnostic request/axios types in `request.ts`.
- **Auth endpoints:** the login/refresh paths are **required** on the factory's
  `auth.authEndpoints` (no built-in default) — no code edits. They flow to the
  interceptor and the recovery route.
- **Refresh request/response shape:** adjust `auth/refresh.ts` (the `fetch` call and
  `RefreshResponseBody`) and the interceptor's `performRefresh` in
  `auth/auth.interceptor.ts`.
- **Toast library:** error toasts use `sonner` in
  `api-error.interceptor.ts`. Swap it there if your app uses a
  different notifier.
- **Caching:** opt-out by default. Tune the global defaults (e.g. `ttl`) via the factory's
  `cache` option; opt in per call with `{ cache: { enabled: true } }`. The kit's defaults
  (opt-out, 60s TTL, 2xx-only, in-memory storage) live in `client.ts` (`setupCache`), and the
  cache key is built by the id-prefixing `generateKey` in `cache/key-generator.ts`. To invalidate
  grouped entries, give related calls a shared `id` (key prefix) and call `storage.remove(regex)`
  on a `createMemoryCacheStorage` store. See [Caching](#caching-opt-in).

---

## FAQ / gotchas

- **Every route 500s with "Next.js can't recognize the exported `config` field"** →
  `config.matcher` in `proxy.ts` must be an inline literal. Next parses it
  statically and won't follow imports, so `matcher: DEFAULT_PROXY_MATCHER` breaks —
  copy the literal instead (see [Quick start](#quick-start) step 2).
- **"Module not found" for `/next` or `/next/server-client`** → add the package to
  `transpilePackages` and check you imported the right subpath.
- **Cookies not sent** → all clients use `withCredentials: true`; ensure the API's
  CORS allows credentials and the cookie `SameSite`/`Secure` settings fit your
  origin setup.
- **Refresh loops** → the interceptor never retries the login/refresh endpoints and
  guards with `config._retried`. Configure endpoint paths once via `authEndpoints`
  (the factory's `auth` config / `createApiClient`) so `isAuthEndpoint` and the refresh call
  always agree.
- **The recovery route redirects straight to login** → it returns `null` from
  `refreshTokens` on any non-2xx **or when the response carries no `Set-Cookie`**;
  verify the refresh endpoint reads the cookie and sets the new session cookies.
- **My `cache` option isn't caching anything** → caching is **opt-out by default**, so you
  must pass `{ cache: { enabled: true } }`. Passing only `{ cache: { ttl } }` inherits the
  disabled global default and silently does nothing. Also: only **2xx** GET/HEAD responses are
  cached (failures are never cached), and server-side clients are per-request (no real cache).
  See [Caching](#caching-opt-in).
- **Token refresh assumption** → this kit assumes the refresh token is **not
  rotated** on each refresh (the refresh endpoint only re-issues the access token).
  Both the browser interceptor and the recovery route can refresh independently;
  that is safe only because they don't invalidate each other's refresh token.
