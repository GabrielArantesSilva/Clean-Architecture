# Pattern — Troubleshooting

> Sintomas comuns ao trabalhar no Kami (ou consumi-lo) e a causa-raiz já
> conhecida. Antes de "consertar", confirme que não está revertendo uma decisão
> deliberada documentada em comentário.

## HTTP / cliente

| Sintoma | Causa provável | Onde olhar |
|---------|----------------|-----------|
| Toast de erro dispara em **todo 401**, mesmo logado | Ordem dos interceptors alterada — Error rodando antes do Auth recuperar | `client.ts` (ordem de registro) |
| **Loop infinito** de refresh | Flag `retried` removida ou `isAuthEndpoint` não barrando o endpoint de auth | `auth.interceptor.ts` |
| Filtros de array somem na query (`status=a&status=b` vira nada) | `paramsSerializer` mexido — API espera chaves repetidas sem `[]` | `client.ts` (`indexes: null`) |
| Refresh retorna 4xx por Content-Type | Body do refresh removido — Fastify v5 exige body+Content-Type consistentes | `auth.interceptor.ts` (`{}` no POST) / `refresh.ts` |
| `response.data` ainda vem com `{ process, body }` | `skipEnvelopeUnwrap: true` setado, ou resposta não passou no `isApiResponse` | `use-case-core.interceptor.ts` |
| Erro de negócio não vira toast | `ignoredErrors` cobrindo a mensagem (ou `'*'`) | `context/ignored-errors.ts` |
| Toast aparece **no servidor** / log estranho de SSR | toast chamado fora do browser | `error.interceptor.ts` (`isBrowser()`) |

## Auth / sessão

| Sintoma | Causa provável | Onde olhar |
|---------|----------------|-----------|
| Usuário deslogado "do nada" | refresh falhou → `onUnauthorized` disparou | callback injetado pelo projeto + `auth.interceptor.ts` |
| `isAccessTokenLive` sempre `false` | token malformado, sem `exp`, ou relógio do cliente errado | `jwt.ts` |
| Cookies não chegam na request server-side | `createServerApiClient` não usado, ou `cookies()` fora de contexto de request | `server.ts` |

## Build / runtime

| Sintoma | Causa provável | Onde olhar |
|---------|----------------|-----------|
| Erro de build "Module not found: next/headers" no cliente | `server.ts`/`next/headers` importado em código de cliente | `boundaries.md §3` |
| Falha no Edge runtime (`Buffer`/`fs` undefined) | API de Node usada em código edge-safe | `jwt.ts`, `refresh.ts` |
| Lint reclama de `console.log` | só `warn`/`error`/`info` permitidos | `eslint.config.mjs` |
| `Cannot redefine plugin '@typescript-eslint'` | espalhou config base junto do `eslint-config-next` | comentário no `eslint.config.mjs` |
| Erro de tipo em índice de array | `noUncheckedIndexedAccess` — acesso pode ser `undefined` | `tsconfig.json` (é proposital) |

## Protocolo

1. **Leia o comentário no ponto de uso.** Muitas "esquisitices" (params, body
   vazio, ordem) são deliberadas e explicadas inline.
2. Reproduza com o mínimo (qual endpoint, server ou client, qual runtime).
3. Cheque se o sintoma bate com a tabela acima antes de mudar contrato público.
4. Se a causa for nova e não-óbvia → registre em `tech-debt/log.md` ou adicione
   linha aqui.
