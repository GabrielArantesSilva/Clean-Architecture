# Glossário — Kami

> O Kami **não tem domínio de negócio** (não modela um setor/cliente). O domínio
> aqui é **técnico**: os conceitos que a codebase-template estabelece e que todo
> projeto consumidor herda. Use estes termos com precisão — eles têm significado
> exato no código.

## Conceitos do cliente HTTP (`next-http-client`)

| Termo | Significado no Kami |
|-------|---------------------|
| **API client** | Instância axios criada por `createApiClient(options)`. Já vem com os três interceptors registrados na ordem correta. |
| **Server client** | Variante criada por `createServerApiClient()` que injeta o header `Cookie` lido via `next/headers`. Só roda no servidor. |
| **Envelope (use-case-core)** | Formato de resposta padrão da API: `{ process: 'success' \| 'failed', body }`. Em `success`, `body` é o dado; em `failed`, `body` é a mensagem de erro (string). |
| **Unwrap** | Ato do `use-case-core.interceptor` de substituir `response.data` por `data.body` quando `process === 'success'`. O consumidor recebe o dado limpo, sem o envelope. |
| **`skipEnvelopeUnwrap`** | Flag de request que desliga o unwrap — para endpoints que não falam o envelope. |
| **Interceptor pipeline** | Ordem fixa: **Auth → UseCaseCore → Error**. A ordem de registro define a ordem de execução no axios. Reordenar quebra o fluxo (toast dispararia em 401 já recuperado). |
| **Single-flight refresh** | Garantia de que múltiplos 401 concorrentes disparam **um único** refresh, compartilhado via `refreshPromise`. |
| **`retried`** | Flag de request que marca uma requisição já reexecutada pós-refresh, para evitar loop infinito de refresh. |
| **`ignoredErrors`** | Config de request (`string[]` ou `'*'`) que suprime o toast de erro para mensagens correspondentes. `'*'` ignora todos. |
| **Auth endpoint** | `/auth/login` e `/auth/generate-access-token`. O auth interceptor **não** tenta refresh quando o próprio endpoint de auth falha. |
| **Edge-safe** | Código que roda no Edge runtime (middleware/route handler): só APIs web-padrão (`atob`, `fetch`), sem `Buffer`/`fs`/`crypto` de Node. `jwt.ts` e `refresh.ts` são edge-safe. |

## Papéis de runtime

| Termo | Significado |
|-------|-------------|
| **Browser context** | Código rodando no navegador. Único lugar onde toast (`sonner`) é exibido (`isBrowser()`). |
| **Server context** | App Router server components, route handlers, middleware. Tem acesso a cookies via `next/headers`. |

## Convenções de código

| Termo | Significado |
|-------|-------------|
| **Barrel** | `index.ts` que define a **API pública** do módulo. Só o que está exportado ali é contrato estável. |
| **Type augmentation** | Extensão de tipos de terceiros (ex.: `@types/axios.d.ts` adiciona `ignoredErrors`/`retried`/`skipEnvelopeUnwrap` ao config do axios). |
| **Padrão de referência** | Implementação no Kami que serve de modelo para os projetos. `next-http-client` é o primeiro. |

---

> **Mantenha vivo:** ao introduzir um novo padrão de referência (um hook, um
> componente, uma convenção), adicione seus termos aqui. O glossário é o contrato
> de vocabulário entre humanos e agentes neste repositório.
