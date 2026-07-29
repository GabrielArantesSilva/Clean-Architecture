# Harness Engineering — kami-front-end
# generated: 2026-06-23
# status: ACTIVE

## IDENTITY
You are the Invisible Senior Developer of this project.
Read ~/.harness-core/skills/harness-skill.md before any response.
The harness skill is the Maestro — it orchestrates all others automatically.

## PROJECT SUMMARY
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

## CRITICAL BOUNDARIES — NEVER VIOLATE
# Boundaries — Kami

> Limites inegociáveis. Um agente **nunca** cruza um boundary sem ADR explícito.
> Como o Kami é uma **codebase-template**, os boundaries protegem sobretudo a
> **generalidade e reusabilidade** do código — não há dados de negócio a proteger.

## 1. Generalidade (o boundary mais importante)

O Kami é replicado em N projetos. Código acoplado a um projeto específico
**contamina todos**. Por isso:

- ❌ **NUNCA** referencie um cliente, produto, domínio de negócio ou projeto
  específico (nomes de entidade de negócio, rotas de telas de um app, regras
  de um cliente). Se aparecer "Pedido", "Paciente", "Apólice" — está no lugar
  errado.
- ❌ **NUNCA** hardcode valores que variam por projeto: URLs de API, nomes de
  cookie, chaves, feature flags, textos de marca. Tudo isso entra por
  **parâmetro / configuração** (padrão `CreateApiClientOptions`).
- ❌ **NUNCA** acople a um design system ou tema de um projeto. Componentes do
  Kami expõem estilo via props/tokens, não cores fixas de uma marca.
- ✅ Tudo exportado deve fazer sentido **fora de qualquer projeto**. Pergunta de
  controle: *"isso seria útil num projeto Origami totalmente diferente?"* Se não,
  não pertence ao Kami.

## 2. Segurança de credenciais e tokens

Mesmo sendo template, o Kami define **como** os projetos lidam com auth — então
o padrão precisa ser seguro por construção:

- ❌ **NUNCA** persista access/refresh token em `localStorage`, `sessionStorage`
  ou variável global de cliente. O padrão é **cookie httpOnly** (gerido pela
  API), consumido via `withCredentials`. Ver `auth.interceptor.ts`.
- ❌ **NUNCA** logue tokens, headers `Authorization`, `Cookie` ou `Set-Cookie`.
- ❌ **NUNCA** verifique assinatura de JWT no front. `isAccessTokenLive` só lê
  `exp` — a verificação real é do backend. Não introduza libs de verificação.
- ✅ Refresh é **single-flight** (uma chamada concorrente compartilhada). Não
  remova o `refreshPromise`.

## 3. Fronteira server / client (Next.js)

- ❌ **NUNCA** importe `server.ts`, `next/headers` ou `cookies()` em código que
  roda no cliente. Isso quebra o build ou vaza contexto de request.
- ❌ **NUNCA** ponha segredo em código que vai para o bundle do navegador. Só
  `NEXT_PUBLIC_*` é público — e mesmo esses não devem conter segredo.
- ✅ Código compartilhado (jwt, refresh) deve ser **edge-safe**: sem `Buffer`,
  `fs`, `crypto` de Node. Use `atob`/`fetch` nativos.

## 4. Compatibilidade do template

- ❌ **NUNCA** introduza dependência pesada/opinativa sem ADR. Cada dep nova é
  herdada por todos os projetos consumidores.
- ❌ **NUNCA** faça breaking change em API pública exportada (`index.ts`) sem
  registrar ADR e nota de migração. Outros projetos dependem dessas assinaturas.
- ✅ Mantenha as exportações públicas mínimas e estáveis (barrel `index.ts`).

## 5. Qualidade não-negociável

- ❌ **NUNCA** use `any` para silenciar o compilador. `strict` +
  `noUncheckedIndexedAccess` estão ligados de propósito.
- ❌ **NUNCA** deixe `console.log` (apenas `warn`/`error`/`info` são permitidos
  pelo ESLint).
- ✅ Decisão não-óbvia → comentário explicando o **porquê** no ponto de uso.

---

## Compliance / dados sensíveis

**Não aplicável.** O Kami não processa, armazena nem trafega dados pessoais ou
sensíveis — é infraestrutura de software. Projetos que **consomem** o Kami e
lidam com PII devem aplicar suas próprias exigências (LGPD etc.) na camada deles.
Se algum dia o Kami passar a embutir tratamento de dado sensível, **isto vira um
boundary novo e exige ADR**.

## HARNESS REFERENCE
Read these files when relevant to the task:
- .harness/domain-glossary.md   — business rules, user types, plans
- .harness/patterns/            — how the team implements each concern
- .harness/adr/                 — architectural decisions already made
- .harness/ai-review-checklist.md — what to verify before PR

## NON-NEGOTIABLE RULES
- Read .harness/domain-glossary.md before implementing any business rule
- Read .harness/adr/ before any architectural decision
- NEVER violate boundaries above
- NEVER generate business logic without tests
- Complexity ≤ 7 per function (SonarQube threshold)
- Coverage ≥ 80% general, ≥ 95% critical code
- ALWAYS ask before assuming on ambiguous requests
