# Pattern — Testes

> **Estado atual:** o Kami ainda **não tem suíte de testes** configurada (sem
> runner, sem deps de teste). Como é uma codebase-template replicada em vários
> projetos, **lógica não-trivial deveria ser testada** — um bug aqui se propaga.
> Este pattern define o alvo; quando o runner for adicionado, registre um ADR.

## O que testar (prioridade)

Foque em **lógica pura e regras de borda**, não em encanamento:

1. **`jwt.ts → isAccessTokenLive`** — token ausente, malformado, sem `exp`,
   `exp` no passado, `exp` no futuro, base64url com padding. É puro e edge-safe:
   trivial de testar, alto valor.
2. **Type guards (`use-case-core.ts`)** — `isApiResponse`/`isFailedResponse`
   contra `null`, objeto vazio, `process` inválido, `body` ausente.
3. **`shouldIgnoreError`** — `undefined`, `'*'`, lista que casa/não casa.
4. **Interceptors (integração)** — com axios mock/MSW: 401 → refresh → retry
   com `retried`; refresh falho → `onUnauthorized`; envelope `failed` → rejeita
   com a mensagem; `skipEnvelopeUnwrap` preserva `response`.
5. **Hooks e componentes** (quando existirem) — comportamento observável, não
   detalhe de implementação.

## Como testar (alvo recomendado)

- **Runner:** Vitest (rápido, ESM-first, casa com Next 16 + TS). Decisão a
  oficializar via ADR quando adotado.
- **Lógica pura:** teste unitário direto, sem mocks.
- **Cliente HTTP:** **MSW** ou adapter mock do axios — intercepte no nível de
  rede, não monkey-patch interno.
- **Componentes/hooks:** Testing Library + `@testing-library/react`. Teste o que
  o usuário vê/faz.

## Princípios

- **Edge-safe continua edge-safe nos testes** — não introduza dependência de
  Node em código testado que precisa rodar no Edge.
- **Sem teste de implementação.** Não asserte ordem de chamada interna; asserte
  resultado. Exceção justificada: a **ordem dos interceptors** é contrato (ver
  comentário em `client.ts`) e pode ter teste de regressão dedicado.
- **Determinístico.** `isAccessTokenLive` usa `Date.now()` — injete/conginele o
  relógio no teste (fake timers) para não ficar flaky.
- **Nomeie pelo comportamento:** `retorna false quando exp já passou`.

## Definition of Done (lógica nova)

- [ ] Caminho feliz + ao menos um caso de borda cobertos
- [ ] Sem flakiness (tempo/rede controlados)
- [ ] Roda em `pnpm test` (quando o script existir) e no CI
