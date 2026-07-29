# ADR-0008 — Config de auth obrigatória, `auth` agrupado e reason fixo

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/core/client.ts`, `auth/config.ts`, `auth/endpoints.ts`

## Contexto

Após a factory virar o ponto único de config (ADR-0006/0007), restavam três
pontos a endurecer:

1. **Parâmetros de auth soltos** em `CreateApiClientOptions` (`authEndpoints`,
   `cookieHeader`, `skipAuthRefresh`) misturados com os de client.
2. **Defaults mágicos** (`DEFAULT_PATHS`, `DEFAULT_AUTH_ENDPOINTS`) deixavam um
   projeto "funcionar" sem declarar suas rotas/endpoints — risco num template, que
   herdaria paths de exemplo silenciosamente.
3. **`sessionExpiredReason` configurável** sem necessidade real — é uma convenção
   interna do kit (a query `?reason=session_expired`), não política de projeto.

## Decisão

1. **Agrupar auth em `CreateApiClientOptions.auth`**:
   `{ authEndpoints, cookieHeader?, skipAuthRefresh? }`. O resto (`baseURL`,
   `headers`, `onUnauthorized`, `skipApiContract`) fica no topo. A factory monta
   esse objeto a partir do `authConfig` resolvido + overrides por chamada.
2. **Remover `DEFAULT_PATHS` e `DEFAULT_AUTH_ENDPOINTS`**:
   - `paths.login`/`recover`/`redirect` e `authEndpoints` (`login`/`refresh`)
     passam a ser **obrigatórios** em `AuthConfigInput`.
   - `paths.public` continua opcional (default derivado `[login, recover]` — é uma
     derivação, não constante de paths).
   - `refreshEndpoint` (refreshTokens) e `authEndpoints` (interceptor) viram
     obrigatórios; sem fallback.
3. **`sessionExpiredReason` fixo no client**: a constante `SESSION_EXPIRED_REASON`
   vive em `auth/config.ts` (não exportada, não configurável). Removida do input;
   `ResolvedAuthConfig.sessionExpiredReason` segue exposto (valor fixo) para o
   proxy/recovery.

`baseURL` permanece opcional (fallback `getDefaultBaseURL()`) — fora do escopo
deste ADR.

## Consequências

- **Positivas:** auth coeso num lugar; um projeto **tem** de declarar suas rotas e
  endpoints (sem herdar paths de exemplo); menos superfície configurável onde não
  havia ganho (reason).
- **Negativas / trade-offs:** mais verboso na config inicial (paths/endpoints
  obrigatórios); o reason deixa de ser ajustável (aceitável — é convenção do kit).
- **Impacto no template:** **breaking** na API pública. Ver migração.
- **Boundaries afetados:** **reforça §1** (Generalidade) — remove valores
  hardcoded/mágicos que um projeto poderia herdar sem perceber.

### Nota de migração

| Antes | Depois |
|-------|--------|
| `createApiClient({ baseURL, authEndpoints, cookieHeader, skipAuthRefresh })` | `createApiClient({ baseURL, auth: { authEndpoints, cookieHeader, skipAuthRefresh } })` |
| `auth: { cookieNames }` (paths/endpoints default) | `auth: { cookieNames, paths: { login, recover, redirect }, authEndpoints: { login, refresh } }` |
| `auth: { sessionExpiredReason: {...} }` | removido — fixo em `?reason=session_expired` |
| `import { DEFAULT_AUTH_ENDPOINTS }` | removido |
| `refreshTokens({ ..., refreshEndpoint? })` | `refreshEndpoint` agora obrigatório |

## Follow-ups

- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): `resolveAuthConfig`
      exige paths/endpoints; `public` default; `urls.sessionExpiredLogin` usa o
      reason fixo; `createApiClient` lê `options.auth.*`.
- [ ] Avaliar tornar `paths.public` e `baseURL` também obrigatórios, se o time
      quiser config 100% explícita.
