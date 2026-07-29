# ADR-0002 — Reestruturação de pastas do `http-client` (por feature)

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client` (camada de API inteira)

## Contexto

O `http-client` estava organizado **por tipo técnico** (`interceptors/`,
`types/`, `context/`), com arquivos avulsos soltos na raiz (`client.ts`,
`constants.ts`, `jwt.ts`, `refresh.ts`, `server.ts`). O efeito era que **cada
feature ficava espalhada por várias pastas**:

- *Auth* vivia em 5 lugares (`interceptors/auth.interceptor.ts`, `auth/`,
  `constants.ts`, `jwt.ts`, `refresh.ts`).
- O *contrato use-case-core* estava partido entre
  `interceptors/use-case-core.interceptor.ts` e `types/use-case-core.ts`, e o
  `types/index.ts` ainda misturava esse contrato com os tipos genéricos de
  request.
- `server.ts` (que usa `next/headers`, server-only) ficava na raiz, longe do
  resto do código Next — flertando com o boundary §3 (fronteira server/client).

Por ser template replicado, a estrutura é **herdada e copiada** por todos os
projetos consumidores — vale investir em uma organização previsível.

## Decisão

Reorganizar **por feature**, com a fronteira de runtime explícita:

```
http-client/
├── index.ts        # API pública universal (client-safe)
├── core/           # client genérico (axios) — sem contrato, sem framework
├── contracts/      # contratos de resposta plugáveis — uma pasta por contrato
│   └── use-case-core/   # default: interceptor + types juntos
├── auth/           # feature de auth: config, endpoints, interceptor, jwt, refresh, browser-client
└── next/           # código Next: proxy (edge), recover-session (route handler),
                    #   server-client (server-only)
```

Regras:
- **`core/` não conhece contrato nem framework.** `client.ts` é o *composition
  root*: importa as peças de `auth/` e `contracts/` e monta o pipeline na ordem
  fixa (auth → contract → error).
- **`contracts/<nome>/` é a unidade plugável** — adicionar suporte a outra API =
  nova pasta irmã + passar o interceptor na opção `contract`.
- **Helpers co-locados** (não há pasta `helpers/` genérica): `ignored-errors`
  junto do `api-error` em `core/`; `jwt`/`refresh` em `auth/`.
- **Fronteira de runtime via entrypoints separados:** `next/index.ts` é
  edge/route-handler-safe (proxy + recovery); `createServerApiClient` (usa
  `next/headers`) fica em `next/server-client.ts` e é importado por subpath, fora
  do barrel — para `next/headers` nunca vazar ao bundle client.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Manter por tipo técnico (status quo) | Zero esforço | Feature espalhada; difícil achar; server.ts solto | É a "confusão" que motivou o ADR |
| Por feature (escolhida) | Cada concern num lugar; contratos plugáveis; fronteira de runtime clara | Migração mecânica de ~15 arquivos; subpaths públicos mudam | — |
| Achatar tudo na raiz | Simples | Não escala; mistura runtimes; pior ainda | — |

## Consequências

- **Positivas:** auth e cada contrato ficam auto-contidos; adicionar um contrato
  novo não espalha código; `next/headers` isolado num entrypoint server-only;
  `core/` reaproveitável sem arrastar contrato/framework.
- **Negativas / trade-offs:** `core/client` passa a depender de `auth/` e
  `contracts/` (composition root) — dependência unidirecional `core → features`,
  aceitável.
- **Impacto no template:** **breaking nos subpaths de import** (ver migração).
  A API pública do barrel raiz (`@/api/http-client`) **não mudou** — mesmos
  símbolos exportados. Projetos consumidores que importavam subpaths precisam
  ajustar os paths.
- **Boundaries afetados:** **reforça** o §3 (server/client) ao isolar
  `next/headers` num entrypoint server-only. Não cria boundary novo.

### Nota de migração (para projetos consumidores)

| Antes | Depois |
|-------|--------|
| `@/api/http-client/server` | `@/api/http-client/next/server-client` |
| `@/api/http-client` (barrel) | inalterado — mesmos exports |
| imports internos `../client`, `../constants`, `../jwt`, `../refresh`, `../types`, `interceptors/*`, `context/*` | `core/*`, `auth/*`, `contracts/use-case-core/*` |

O barrel `@/api/http-client/next` continua válido (proxy + recovery).

## Follow-ups

- [x] Atualizar README (nova seção *Layout*, *Entry points*, *API reference*,
      *Customization* e quick start)
- [ ] `domain-glossary.md`: não introduziu termo de negócio (n/a)
- [x] **Resolvido — ver ADR-0009:** `auth/refresh.ts` deixou de assumir o envelope
      `use-case-core`. Agora é agnóstico de contrato (valida por `2xx` + `Set-Cookie`,
      sem parsear o body).
- [ ] Cobrir com teste quando o runner existir (ver ADR-0001 / `patterns/testing.md`).
