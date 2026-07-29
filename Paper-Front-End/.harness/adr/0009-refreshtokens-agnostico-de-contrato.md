# ADR-0009 — `refreshTokens` agnóstico de contrato

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/auth/refresh.ts`

> Resolve a dívida latente registrada no **ADR-0002** (refresh edge acoplado ao
> contrato `use-case-core`).

## Contexto

`refreshTokens` é edge-safe (fetch nativo, fora do pipeline de interceptors), mas
**conhecia o contrato `use-case-core`**: importava `ApiResponse` de
`contracts/use-case-core`, validava `json.process !== 'success'` e extraía
`json.body.tokens?.accessToken`. Isso quebrava a separação contrato × resto do
kit — um 2º contrato de resposta exigiria editar esta função.

Observação-chave: o `accessToken` extraído **não era consumido** por ninguém. O
único caller (`createSessionRecoveryHandler`) usa apenas `setCookieHeaders`. O
parse do body servia só para *validar* o sucesso.

## Decisão

Tornar `refreshTokens` **agnóstica de contrato**: nunca parsear o body.

O critério de sucesso passa a depender apenas do **modelo de auth do kit** (auth
vive em cookies httpOnly — invariante universal, ver `boundaries.md §2`), não do
contrato de resposta:

> Sucesso = resposta `2xx` **que emite novos cookies de sessão** (`Set-Cookie`).

```ts
if (!res.ok) return null
const setCookieHeaders = res.headers.getSetCookie()
if (setCookieHeaders.length === 0) return null
return { setCookieHeaders }
```

- Removidos: o import de `contracts/use-case-core`, o tipo `RefreshResponseBody`,
  o campo `accessToken` de `RefreshTokensResult` (não usado) e a opção
  `refreshEndpoint` segue obrigatória (ADR-0008).
- Um contrato que responde a um refresh falho com `2xx + corpo de erro` não emite
  `Set-Cookie`, então continua sendo tratado como falha — sem ler o body.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Heurística `2xx + Set-Cookie` (escolhida) | Zero parse de body; depende só do modelo cookie (universal); simples | Pressupõe que refresh emite cookies (já é premissa do kit) | — |
| Callback `isSuccessful(data)` injetado | Flexível p/ validar body | Quem injeta? Acoplaria o recovery/factory ao contrato; mais API | Complexidade sem ganho (accessToken não é usado) |
| Só `res.ok` | Mais simples ainda | Um contrato 2xx-em-falha passaria como sucesso | Frágil |

## Consequências

- **Positivas:** `refresh.ts` não importa mais `contracts/`; um novo contrato de
  resposta não exige tocá-lo; menos superfície (`accessToken` removido).
- **Negativas / trade-offs:** depende da premissa "refresh emite `Set-Cookie`" —
  verdadeira para auth cookie-based (o modelo do kit). Uma API que devolvesse o
  token só no body (sem cookie) não seria suportada — mas isso já contraria o
  `boundaries.md §2` (tokens em cookie httpOnly).
- **Impacto no template:** **breaking menor** — `RefreshTokensResult.accessToken`
  removido (ninguém consumia). Ver migração.
- **Boundaries afetados:** **reforça** a separação de contratos (o contrato volta
  a ser só o interceptor + types em `contracts/`).

### Nota de migração

| Antes | Depois |
|-------|--------|
| `refreshTokens(...)` → `{ accessToken, setCookieHeaders }` | → `{ setCookieHeaders }` |
| sucesso = `2xx` + `process==='success'` + `accessToken` | sucesso = `2xx` + há `Set-Cookie` |

## Follow-ups

- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): `2xx` sem
      `Set-Cookie` → null; `2xx` com `Set-Cookie` → result; non-2xx → null;
      independente do shape do body.
