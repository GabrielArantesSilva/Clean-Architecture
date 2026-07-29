# Contexto — Kami

> Documento-raiz do Harness. Todo agente lê este arquivo primeiro.

## O que é o Kami

O **Kami** é a **codebase-template interna da Origami Lab**: uma base de
referência que provê **componentes, hooks, clients HTTP e implementações
padrão** reaproveitadas entre os projetos da empresa.

O problema que ele resolve: hoje cada projeto novo **recria do zero** as mesmas
peças — cliente HTTP com auth/refresh, tratamento de erro, hooks utilitários,
componentes de UI. O Kami centraliza essas peças como **padrão vivo**, para que
um projeto novo parta de uma base testada, consistente e já alinhada com as
convenções do time.

- **Tipo:** biblioteca-template / starter de referência (não é um produto final).
- **Cliente:** interno (Origami Lab). Não há cliente externo.
- **Domínio de negócio:** não aplicável — o Kami é infraestrutura de software,
  não modela regras de um negócio específico. O "domínio" aqui é **técnico**
  (ver `domain-glossary.md`).
- **Estado:** greenfield. 1º commit; a camada de API (`next-http-client`) já
  está estabelecida como o primeiro padrão de referência.

## Stack

| Camada            | Tecnologia                                              |
|-------------------|---------------------------------------------------------|
| Linguagem         | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)     |
| Framework         | Next.js 16 (App Router) + React                         |
| HTTP              | axios — cliente próprio em `src/api/next-http-client/`  |
| Feedback/UX       | sonner (toasts)                                         |
| Lint              | ESLint 9 flat config + `eslint-config-next` 16          |
| Package manager   | pnpm                                                    |
| Runtime alvo      | Node.js + **Edge runtime** (middleware/route handlers)  |

> **Backend consumido:** os projetos que usam o Kami conversam com uma API
> **Fastify v5 + AJV** que responde no envelope `{ process, body }`. O Kami não
> contém o backend — apenas o **client** que fala com ele. Ver
> `patterns/error-handling.md`.

## Estrutura atual

```
src/
├── api/
│   └── next-http-client/      # cliente HTTP de referência (auth, refresh, envelope, erros)
│       ├── client.ts          # createApiClient + ordem dos interceptors
│       ├── server.ts          # createServerApiClient (cookies do next/headers)
│       ├── jwt.ts             # isAccessTokenLive — edge-safe, sem verificar assinatura
│       ├── refresh.ts         # refreshTokens — fetch nativo, edge-safe
│       ├── constants.ts       # endpoints de auth
│       ├── interceptors/      # auth → use-case-core → error (ordem importa)
│       ├── context/           # ignoredErrors
│       └── @types/            # augmentation do axios + envelope use-case-core
├── components/                # (a popular) componentes de UI reutilizáveis
└── hooks/                     # (a popular) hooks utilitários
```

## Princípios do Kami

1. **Genérico por contrato.** Nada aqui pode acoplar a um projeto, cliente ou
   domínio de negócio específico. Ver `boundaries.md`.
2. **Edge-safe quando possível.** Auth/token funcionam em middleware e route
   handlers — sem APIs exclusivas de Node.
3. **O "porquê" mora no código.** Decisões não-óbvias (ordem de interceptor,
   serialização de params, body vazio no refresh) são explicadas em comentário
   no ponto de uso. Esse é um padrão do Kami, não exceção.
4. **Configurável, não hardcoded.** `baseURL`, nomes de cookie, callbacks
   (`onUnauthorized`) entram por parâmetro — nunca fixos no código.
5. **Server e client separados.** Código que usa `next/headers` ou `cookies()`
   vive em `server.ts`; nunca vaza para bundle de cliente.

## Como navegar este Harness

| Preciso de…                                  | Leia…                          |
|----------------------------------------------|--------------------------------|
| O que pode/não pode entrar no template       | `boundaries.md`                |
| Vocabulário técnico (envelope, interceptor…) | `domain-glossary.md`           |
| Padrões replicáveis                          | `patterns/*.md`                |
| Checklist antes de PR                        | `ai-review-checklist.md`       |
| Registrar uma decisão                        | `adr/template.md`              |
| Registrar dívida técnica                     | `tech-debt/log.md`             |
| Propor mudança ampla                         | `rfc/template.md`              |
| Contrato com API/serviço externo             | `integrations/template.md`     |
