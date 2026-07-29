# ADR-0001 — Endpoints de auth configuráveis (não mais hardcoded)

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client` (camada de API / auth)

## Contexto

As rotas de API de autenticação viviam como constantes de módulo em
`constants.ts` (`LOGIN_ENDPOINT = '/auth/login'`,
`REFRESH_TOKEN_ENDPOINT = '/auth/generate-access-token'`), consumidas direto
pelo `auth.interceptor.ts`. Dois problemas:

1. **Boundary §1 (Generalidade).** O Kami é uma codebase-template replicada em N
   projetos; `boundaries.md` proíbe hardcodar valores que variam por projeto
   (URLs/paths de API) — eles devem entrar por configuração. As rotas de auth da
   API são exatamente esse tipo de valor: o contrato varia entre projetos
   Origami. Um projeto com paths diferentes era obrigado a **editar o código do
   Kami**, contaminando a base para todos.
2. **Fonte de verdade furada.** `refresh.ts` (refresh edge-safe via `fetch`)
   **re-hardcodava** a string `/auth/generate-access-token` em vez de reusar a
   constante, e o README instruía a "manter em sincronia na mão" — anulando o
   propósito da constante.

Por ser template, esta decisão é **herdada por todos os projetos consumidores**.

## Decisão

Promover os endpoints de auth a **configuração**, mantendo os valores atuais
como **defaults de fábrica** numa única fonte de verdade:

- `constants.ts` passa a exportar o tipo `AuthEndpoints` (`{ login, refresh }`) e
  `DEFAULT_AUTH_ENDPOINTS` — os únicos lugares onde os paths default existem.
- `defineAuthConfig` aceita `authEndpoints?: Partial<AuthEndpoints>` e resolve em
  `ResolvedAuthConfig.authEndpoints` (preenchendo defaults campo a campo).
- `createApiClient` aceita `authEndpoints?: AuthEndpoints` e repassa ao
  interceptor; `refreshTokens` aceita `refreshEndpoint?` (default = o de fábrica).
- O `auth.interceptor.ts` deixa de importar constantes fixas e recebe os
  endpoints por parâmetro (`isAuthEndpoint`/`performRefresh`).
- Propagação fechada em todos os entry points: `createBrowserAuthClient`,
  `createServerApiClient` (novo 2º arg opcional) e `createSessionRecoveryHandler`.

Tudo **opcional e backward-compatible**: quem não passar nada continua com
`/auth/login` e `/auth/generate-access-token`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Manter constants e só fazer `refresh.ts` importar a constante (correção mínima) | Diff mínimo; mata a duplicação | Mantém o path hardcoded — **não** resolve o boundary §1 | Não atende ao alinhamento total pedido |
| Promover a config com defaults de fábrica (escolhida) | Resolve boundary §1; fonte única de default; compatível | Amplia a API pública (novo tipo + opções) | — |
| Deletar `constants.ts` e inlinar defaults nas opções | Um arquivo a menos | Espalha o literal em vários módulos; reabre a duplicação | Contradiz "fonte única" |

## Consequências

- **Positivas:** projetos com paths de auth diferentes configuram em **um lugar**
  (`defineAuthConfig`) sem editar o Kami; a duplicação `refresh.ts`↔`constants.ts`
  acabou; `isAuthEndpoint` e a chamada de refresh sempre concordam por
  construção.
- **Negativas / trade-offs:** a superfície pública cresceu (novo tipo
  `AuthEndpoints`, nova opção em 3 fábricas); um campo a mais para documentar.
- **Impacto no template:** **não** é breaking — todas as opções são opcionais com
  os defaults antigos. Adições à API pública (`index.ts`): export de
  `AuthEndpoints` (type) e `DEFAULT_AUTH_ENDPOINTS`. `createServerApiClient`
  ganhou 2º parâmetro opcional (assinatura compatível).
- **Boundaries afetados:** **reforça** o boundary §1 (Generalidade) — remove um
  hardcode que o violava. Não cria boundary novo.

## Follow-ups

- [x] Atualizar README (`Customization`, FAQ, API reference, tabela de endpoints)
- [ ] Cobrir com teste quando o runner existir (ver `patterns/testing.md`):
      `isAuthEndpoint` com endpoints customizados; `refreshTokens` honrando
      `refreshEndpoint`. Sem suíte hoje — registrar no `tech-debt/log.md` se
      necessário.
- [ ] `domain-glossary.md`: não introduziu termo de negócio (n/a).
