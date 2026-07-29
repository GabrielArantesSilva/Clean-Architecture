# ADR-0007 — Consolidação dos clients browser/server na factory

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/core/factory.ts`, `next/server-client.ts`

> Resolve o follow-up aberto no **ADR-0006** (`createBrowserAuthClient` /
> `createServerApiClient` coexistiam sem herdar os defaults da factory).

## Contexto

Após o ADR-0006, `createApiClientFactory` virou o ponto único de config, mas
`createBrowserAuthClient` e `createServerApiClient` continuavam como funções
paralelas que **não herdavam** os defaults da factory (ex.: `headers`). Havia três
formas de obter um client e duas delas ignoravam a config compartilhada.

## Decisão

Consolidar os dois "modos" na factory:

- **Browser:** o comportamento de `createBrowserAuthClient` (redirect ao
  `urls.sessionExpiredLogin` quando o refresh esgota) foi **embutido no client
  default da factory** — `apiFactory()` já o aplica. O redirect é **no-op fora do
  browser** (`typeof window` guard), então é seguro em RSC. Sobreponível por
  `onUnauthorized` (na config da factory ou por chamada).
  → `auth/browser-client.ts` **removido**.
- **Server:** `createServerApiClient` foi reescrito para **receber a factory** —
  `createServerApiClient(apiFactory, overrides?)` — lê os cookies do request e
  chama a factory com `cookieHeader` + `skipAuthRefresh: true`. Assim **herda** os
  defaults (headers/baseURL/endpoints).

### Por que o server não virou método da factory

`createServerApiClient` toca `next/headers` (`cookies()`), que é **server-only**.
A factory vive em `core/` (universal, client-safe); um método `.server()` na
factory arrastaria `next/headers` para o bundle do cliente — violando o
**boundary §3** (fronteira server/client). Por isso o server-client permanece em
`next/` (server-only) e **consome** a factory, em vez de ser parte dela.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| `apiFactory.server()` como método | "Tudo na factory" | Arrasta `next/headers` ao cliente (§3) | Quebra a fronteira |
| Método `.browser()` separado de `apiFactory()` | Explícito | Mais uma forma de criar client | Redirect default no `apiFactory()` é mais simples e era o padrão recomendado |
| Browser embutido + server recebe a factory (escolhida) | 1 forma p/ browser; server herda defaults; respeita §3 | Server fica fora da factory (assimétrico) | — |

## Consequências

- **Positivas:** `apiFactory()` é o client browser pronto (redirect default);
  `createServerApiClient(apiFactory)` herda os defaults; uma só fonte de config.
- **Negativas / trade-offs:** assimetria browser (na factory) × server (helper que
  recebe a factory) — justificada pela fronteira de runtime. `apiFactory()` agora
  carrega um efeito de navegação por default (no-op no server, sobreponível).
- **Impacto no template:** **breaking** — `createBrowserAuthClient` e
  `BrowserAuthClientOptions` removidos; `createServerApiClient` mudou de assinatura.
  Ver migração.
- **Boundaries afetados:** **reforça** §3 (server-only isolado em `next/`).

### Nota de migração

| Antes | Depois |
|-------|--------|
| `createBrowserAuthClient(authConfig)` | `apiFactory()` |
| `createBrowserAuthClient(authConfig, { onUnauthorized })` | `apiFactory({ onUnauthorized })` (ou na config da factory) |
| `createServerApiClient(baseURL?, authEndpoints?)` | `createServerApiClient(apiFactory, overrides?)` |
| `import { BrowserAuthClientOptions }` | removido — use `ApiClientOverrides` |

## Follow-ups

- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): redirect default
      no-op fora do browser; `createServerApiClient` herda `headers` da factory e
      aplica `skipAuthRefresh`.
