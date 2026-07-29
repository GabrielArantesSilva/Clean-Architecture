import { cookies } from 'next/headers'

import type { ApiClientFactory, ApiClientOverrides } from '../factory'

export async function getServerCookieHeader(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')
}

// Server-side client built from your `apiFactory`, so it inherits the shared
// headers/baseURL/endpoints. Forwards the incoming request cookies and disables
// refresh by default: a refresh during server rendering can't write cookies back
// to the browser, so let the 401 surface to the recovery route (the single
// cookie-mutating path). This lives here, not on the factory, because it touches
// `next/headers` (server-only) and the factory must stay client-safe.
export async function createServerApiClient(
  factory: ApiClientFactory,
  overrides: ApiClientOverrides = {},
) {
  const cookieHeader = await getServerCookieHeader()
  return factory({
    ...overrides,
    cookieHeader,
    skipAuthRefresh: overrides.skipAuthRefresh ?? true,
  })
}
