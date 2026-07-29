# ADR-0003 — Seleção de contrato por flag boolean (não por callback aberto)

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/core/client.ts` (opção `contract`)

> **Nota (mesma sessão):** a flag descrita aqui como `contract` foi depois
> **renomeada para `skipApiContract`** (e unificada em `createApiClient` +
> `createBrowserAuthClient` — ver ADR-0004, follow-ups). A decisão deste ADR
> (booleano em vez de callback aberto) permanece; só o nome do campo mudou.

## Contexto

`createApiClient` recebia `contract?: ContractInterceptor | false`, onde
`ContractInterceptor = (client: AxiosInstance) => void` — um **callback aberto**:
o consumidor podia injetar qualquer interceptor de contrato em runtime.

O Kami é um **boilerplate**: cada projeto consumidor parte de uma cópia e a
**adapta editando código**. Uma API de extensão aberta (passar função) é mais
superfície pública para manter e versionar do que o boilerplate precisa — a
escolha de contrato é feita uma vez, no setup do projeto, não dinamicamente.

## Decisão

Trocar a opção por um **booleano simples**: `contract?: boolean` (default `true`).

- `true`/omitido → aplica o adapter default (envelope use-case-core).
- `false` → respostas axios cruas (sem unwrap).
- Para um contrato **diferente**, o projeto registra outro interceptor de
  `contracts/` dentro de `core/client.ts` (escolha em código, não em runtime).

O tipo público `ContractInterceptor` é **removido**. A pasta `contracts/`
permanece como o lugar onde os contratos disponíveis moram (cada um com seu
interceptor + types); o default segue sendo `use-case-core`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Manter `ContractInterceptor \| false` (callback aberto) | Flexível em runtime | Superfície pública maior; flexibilidade que um boilerplate não usa | Mais API para versionar sem ganho real |
| `contract?: boolean` (escolhida) | Mínima; intenção óbvia (liga/desliga) | Trocar de contrato exige editar código | Alinhado ao modelo "boilerplate adaptado em código" |
| String enum (`'use-case-core' \| 'raw'`) | Extensível por nome | Registry/lookup desnecessário com 1 contrato | Over-engineering para o estado atual |

## Consequências

- **Positivas:** API pública menor e mais simples; intenção explícita; menos
  para documentar/versionar; coerente com a natureza boilerplate.
- **Negativas / trade-offs:** não dá mais para injetar um contrato custom em
  runtime — é preciso editar `core/client.ts`. Aceitável para um boilerplate.
- **Impacto no template:** **breaking** em quem passava uma função em `contract`
  (ver migração). `contract: false` e o default continuam idênticos. Remove o
  export público `ContractInterceptor`.
- **Boundaries afetados:** nenhum novo. Reforça §4 (API pública mínima e estável).

### Nota de migração

| Antes | Depois |
|-------|--------|
| `createApiClient({ contract: fn })` | registrar o interceptor em `core/client.ts`; chamar sem `contract` |
| `createApiClient({ contract: false })` | inalterado |
| `createApiClient({})` (default) | inalterado |
| `import { ContractInterceptor }` | removido — não há mais tipo público |

## Follow-ups

- [x] Atualizar README (*The default API contract*, *Using another API contract*,
      *Features in depth*, *API reference*, *Customization*, nota do *Layout*)
- [ ] `domain-glossary.md`: sem termo de negócio novo (n/a)
- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): `contract: false`
      preserva `response.data` cru; default faz unwrap.
