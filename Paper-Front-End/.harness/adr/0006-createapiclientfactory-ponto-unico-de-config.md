# ADR-0006 — `createApiClientFactory`: ponto único de configuração (client + auth)

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/core/factory.ts` (e `auth/config.ts`)

> Supersede parcialmente o **ADR-0005**: a `defineClientConfig` ali introduzida é
> removida e absorvida por `createApiClientFactory` (que também integra auth).

## Contexto

A configuração estava espalhada em dois pontos: `defineAuthConfig` (política de
auth) e `defineClientConfig` (defaults de client — headers etc.). Um projeto
consumidor precisava orquestrar os dois e ligá-los manualmente aos entry points
(proxy, recovery, clients). O dev pediu **um único ponto de configuração**: uma
factory que recebe client + auth e é usada nos services.

## Decisão

Criar `createApiClientFactory(config)` em `core/factory.ts` — **forma curried**:
recebe toda a config uma vez e devolve uma factory chamável.

```ts
createApiClientFactory(configTodas) => (overridesOpcionais?) => AxiosInstance
```

- `config.auth` (`AuthConfigInput`) é resolvido **uma vez** (via `resolveAuthConfig`)
  e exposto como **`factory.authConfig`** (`ResolvedAuthConfig`) — consumido por
  `createAuthProxy` e `createSessionRecoveryHandler`.
- Defaults de client (`headers`, `onUnauthorized`, `skipApiContract`,
  `skipAuthRefresh`, `baseURL`) ficam na factory; cada chamada aceita overrides
  (shallow-merge; `headers` deep-merge). `cookieHeader` é por-chamada (server).
- A factory é uma **função com propriedade** (`Object.assign`): chamável para
  criar clients **e** portadora de `.authConfig`.

Mudanças de superfície:
- **Removido:** `defineAuthConfig` (público) e `defineClientConfig` (do ADR-0005).
- **Renomeado:** a lógica de resolução de auth virou `resolveAuthConfig`
  (interna — só a factory a usa; não exportada no barrel público).
- **Mantidos:** `createApiClient` (primitiva de baixo nível, que a factory usa),
  `createBrowserAuthClient`, `createServerApiClient`, e os tipos de auth.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Factory retorna objeto `{ create, authConfig }` | Explícito | Mais verboso no service (`.create()`) | Dev quis forma função |
| Factory recebe `ResolvedAuthConfig` (composável) | Sem resolver auth 2x | Mantém `defineAuthConfig` público | Dev quis um ponto único |
| Função com `.authConfig` (escolhida) | `service: apiFactory()`; `proxy: apiFactory.authConfig` | Função-com-propriedade é menos óbvia | — |

## Consequências

- **Positivas:** um único ponto de config; services chamam `apiFactory()`; proxy/
  recovery reusam a MESMA auth resolvida (`apiFactory.authConfig`); headers padrão
  herdados por todo client da factory.
- **Negativas / trade-offs:**
  - **Coexistência:** `createBrowserAuthClient` e `createServerApiClient` continuam
    existindo e **não herdam** os defaults da factory (ex.: `headers`). Hoje quem
    quer os headers compartilhados deve usar `apiFactory(...)`. Ver follow-up.
  - Função-com-propriedade (`apiFactory` é chamável e tem `.authConfig`) é um
    padrão menos familiar.
- **Impacto no template:** **breaking** na API pública — `defineAuthConfig` e
  `defineClientConfig` saíram. Ver migração.
- **Boundaries afetados:** nenhum novo (config segue por parâmetro, §1).

### Nota de migração

| Antes | Depois |
|-------|--------|
| `const authConfig = defineAuthConfig({ cookieNames, … })` | `const apiFactory = createApiClientFactory({ auth: { cookieNames, … }, headers, … })` |
| `createAuthProxy(authConfig)` | `createAuthProxy(apiFactory.authConfig)` |
| `createSessionRecoveryHandler(authConfig)` | `createSessionRecoveryHandler(apiFactory.authConfig)` |
| `const c = defineClientConfig({ headers })` ; `c()` | `apiFactory()` (auth incluído) |
| client nos services | `apiFactory()` / `apiFactory({ cookieHeader })` |

## Follow-ups

- [x] Atualizar README (quick start, API reference, entry points, customization, layout)
- [x] **Resolvido — ver ADR-0007:** `createBrowserAuthClient` embutido em
      `apiFactory()` (removido); `createServerApiClient` passou a receber a factory
      (herda os defaults). Server fica em `next/` por causa de `next/headers` (§3).
- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): merge de overrides,
      deep-merge de `headers`, e `factory.authConfig` refletindo os defaults.
