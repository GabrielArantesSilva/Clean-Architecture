# ADR-0004 — AuthConfig agrupado: `paths` / `authEndpoints` / `urls`

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/auth/config.ts` (e consumidores em `next/`)

## Contexto

`AuthConfigInput`/`ResolvedAuthConfig` tinham os paths como **campos soltos no
topo** (`loginPath`, `recoverPath`, `defaultRedirectPath`, `publicPaths`) e ainda
misturavam três naturezas diferentes sob nomes parecidos:

- **rota de front** (`loginPath`),
- **URL derivada** (`sessionExpiredLoginUrl` = path + query),
- **endpoint de API** (`authEndpoints.login`).

Todos com "login" no nome — difícil saber, ao ler, se um valor é uma rota de
tela, uma URL pronta ou um path de API.

## Decisão

Agrupar a config em objetos por **natureza**, deixando a distinção path × url ×
endpoint explícita no acesso:

```ts
ResolvedAuthConfig {
  cookieNames
  baseURL
  paths:        { login, recover, redirect, public: string[] }  // rotas de front
  authEndpoints:{ login, refresh }                              // paths de API
  sessionExpiredReason
  urls:         { sessionExpiredLogin }                         // derivadas (path + query)
}
```

- Renomeações: `loginPath → paths.login`, `recoverPath → paths.recover`,
  `defaultRedirectPath → paths.redirect`, `publicPaths → paths.public`,
  `sessionExpiredLoginUrl → urls.sessionExpiredLogin`.
- `paths` no input é `Partial<AuthPaths>` (default por campo; `public` default =
  `[login, recover]`). `urls` é **sempre derivado** — não entra no input.
- Novos tipos públicos: `AuthPaths`, `AuthUrls`.

Regra de leitura: **`paths.*`** = rota de tela · **`authEndpoints.*`** = chamada
de API · **`urls.*`** = URL pronta (com query).

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Campos soltos (status quo) | Simples | Mistura path/url/endpoint; nomes ambíguos | É o problema |
| `paths` + `urls` agrupados (escolhida) | Separação path×url×endpoint explícita; simétrico | API pública muda | — |
| `path` no singular | Próximo do enunciado original | Inconsistente com `cookieNames`/`authEndpoints`/`urls` (plurais) | Plural escolhido pelo dev |

## Consequências

- **Positivas:** intenção óbvia no ponto de uso (`config.paths.login` vs
  `config.authEndpoints.login` vs `config.urls.sessionExpiredLogin`); config
  organizada por natureza; `urls` derivado num lugar só.
- **Negativas / trade-offs:** acesso mais aninhado; **breaking** na API pública.
- **Impacto no template:** **breaking** — projetos consumidores ajustam o input de
  `defineAuthConfig` e qualquer acesso a `config.loginPath`/`sessionExpiredLoginUrl`.
  Ver migração.
- **Boundaries afetados:** nenhum novo.

### Nota de migração

| Antes | Depois |
|-------|--------|
| `defineAuthConfig({ loginPath, recoverPath, defaultRedirectPath, publicPaths })` | `defineAuthConfig({ paths: { login, recover, redirect, public } })` |
| `config.loginPath` / `recoverPath` / `defaultRedirectPath` | `config.paths.login` / `.recover` / `.redirect` |
| `config.publicPaths` | `config.paths.public` |
| `config.sessionExpiredLoginUrl` | `config.urls.sessionExpiredLogin` |
| `authEndpoints` / `sessionExpiredReason` / `cookieNames` / `baseURL` | inalterados |

## Follow-ups

- [x] Atualizar README (exemplo do `defineAuthConfig`, API reference, route handler)
- [x] **Resolvido (mesma sessão):** a opção de contrato estava assimétrica
      (`createApiClient` usava `skipApiContract`, `createBrowserAuthClient` usava
      `contract`). Unificada para **`skipApiContract`** em ambos.
- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): defaults de `paths`
      e derivação de `urls.sessionExpiredLogin`.
