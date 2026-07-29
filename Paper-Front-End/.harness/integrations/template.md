# Integração — <nome do serviço/API externa>

> Contrato de integração entre código do Kami (ou de um consumidor) e um serviço
> externo. Copie para `integrations/<slug>.md`. O caso de referência atual é a
> **API backend (Fastify v5 + AJV)** consumida pelo `next-http-client`.

- **Serviço:** <nome>
- **Tipo:** REST | GraphQL | Webhook | SSO | Gateway de pagamento | Outro
- **Dono do contrato:** <time/repo que mantém o serviço>
- **Ambientes / baseURL:** injetado via config (`NEXT_PUBLIC_API_URL` / opção
  `baseURL`), **nunca** hardcoded — ver `boundaries.md §1`.

## Formato de mensagem

Descreva o contrato. Para a API padrão Origami, o envelope é:

```ts
type ApiResponse<T> =
  | { process: 'success'; body: T }
  | { process: 'failed';  body: string }
```

- Como o sucesso é desempacotado: ver `patterns/error-handling.md` (unwrap).
- Endpoints fora do envelope: usar `skipEnvelopeUnwrap: true`.

## Autenticação

- Mecanismo: <cookie httpOnly + JWT / API key / OAuth / …>.
- Para o backend padrão: cookie httpOnly, `withCredentials`, refresh em
  `/auth/generate-access-token`, login em `/auth/login`. Ver
  `patterns/security.md`.
- **Onde ficam os segredos:** nunca no bundle do cliente; server-side via
  `cookies()`/env.

## Resiliência

- **Retry:** <política>. No padrão atual: retry único pós-refresh, guardado por
  `retried` (anti-loop). Não há retry genérico com backoff embutido.
- **Refresh concorrente:** single-flight via `refreshPromise`.
- **Timeout / circuit breaker:** <definir se aplicável — não há hoje>.
- **Idempotência:** <quais operações são seguras para repetir>.

## Tratamento de erro

- Erros de transporte vs. negócio: ver `patterns/error-handling.md`.
- Toasts suprimíveis via `ignoredErrors`.

## Particularidades / pegadinhas

> Registre aqui as decisões não-óbvias do contrato (as do backend padrão já
> estão em comentários no código):
- `paramsSerializer: { indexes: null }` — API espera `status=a&status=b`, não
  `status[]` (o AJV com `removeAdditional: 'all'` descartaria os bracketed).
- Refresh exige body `{}` + `Content-Type: application/json` (Fastify v5).

## Checklist de integração

- [ ] baseURL/segredos por config, não hardcoded
- [ ] Erros mapeados ao pipeline de interceptors
- [ ] Edge-safety verificada se chamada de middleware/route handler
- [ ] Pegadinhas do contrato comentadas no código E aqui
- [ ] Contato/dono do serviço registrado
