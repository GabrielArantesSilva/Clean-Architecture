// API paths of the auth endpoints the kit talks to. The contract varies between
// Origami projects, so there is **no built-in default** — a consuming project
// must declare these on the factory's `auth` config. Used by the auth interceptor
// and the edge refresh.
export type AuthEndpoints = {
  /** Login endpoint — never auto-refreshed (a bad login must not loop). */
  login: string
  /** Refresh endpoint — re-issues the access token from the refresh cookie. */
  refresh: string
}
