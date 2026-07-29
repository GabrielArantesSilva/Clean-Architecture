# ADR-0004 — Convenções de autoria de use case: `PaginatorSchema` reutilizável + catálogo de erros de domínio por módulo

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro

> ✅ **Aplicado em 2026-07-24.** Duas convenções de *como se escreve um use case*
> no back de referência, inspiradas no `integrator-api` e no obras-api (inspiração
> de estrutura, ADR-023 do harness-core; segue-se a ideia, não se copia cru).
> Suíte verde (40 unit + 9 db), typecheck e lint limpos.

## Contexto

Duas arestas apareceram nos use cases do módulo `users` (implementação de
referência):

1. **Paginação duplicada.** O `list-users.use-case.ts` declarava o schema de
   `page`/`pageSize` **inline** no seu validator. Todo novo endpoint de listagem
   copiaria esse mesmo bloco — divergência garantida no dia em que os limites
   mudarem. O `integrator-api` já resolve com um `paginatorJsonSchema` TypeBox
   compartilhado que cada list use case compõe, mantendo o `packages/database`
   **sem** dependência de validação.

2. **Erros de negócio como string solta.** `NotFoundException('Usuario nao
   encontrado')`, `ConflictException('E-mail ja cadastrado')` — mensagens em pt,
   sem padrão, espalhadas pelos use cases. O obras-api define os erros de negócio
   como **enum** por módulo (`<Módulo>DomainErrorType`) em `domain/errors/`, com
   uma classe de factories estáticas (`throw XDomainError.itemNotFound()`) — erros
   enumerados, bem definidos, em um só lugar. O `integrator-api` também usa
   mensagens em inglês orientadas a recurso.

## Opções Consideradas

### Paginação — onde mora o schema reutilizável
- **Opção A (escolhida): `PaginatorSchema` no kit `framework/use-case`**
  (`shared/schemas/pagination.schema.ts`), importando só TypeBox, exportado pelo
  barrel `@/use-case`. Prós: reutilizável por qualquer módulo; **não acopla** o
  kit `framework/database` a TypeBox (fica extraível, como o `packages/database`
  do integrator); cache do `BaseValidator` (WeakMap por identidade de schema)
  compila **uma vez** e reusa entre todos os list use cases. Contras: a tipagem
  (`IPaginator`, em `framework/database`) e o schema vivem em kits diferentes —
  ficam alinhados pela assinatura de `listPaginated(paginator: IPaginator)`, que
  falha o typecheck se divergirem.
- **Opção B: `PaginatorSchema` co-locado em `framework/database/pagination.ts`**,
  derivando `IPaginator = Static<typeof PaginatorSchema>` (single source of
  truth). Rejeitada: acoplaria o kit de database a TypeBox, contrariando o
  princípio "database extraível/agnóstico" do ADR-025 e a separação que o próprio
  integrator faz (schema fora do `packages/database`).

### Erros — como adotar o catálogo enum sem quebrar o envelope
- **Opção A (escolhida): enum + factories que lançam `HttpException` com o código
  do enum no `body`.** `domain/errors/users-domain-error.ts` define
  `UsersDomainErrorType` (`USER_NOT_FOUND`, `EMAIL_ALREADY_IN_USE`) + a classe
  `UsersDomainError` com `userNotFound()`/`emailAlreadyInUse()` retornando a
  `NotFoundException`/`ConflictException` certa, com o código do enum como `body`.
  Prós: erros enumerados (como obras); **preserva** o envelope `{ process, body }`
  e o boundary "use case lança HttpException"; código do enum vira contrato
  estável pro front (como obras trata os enums); **zero mudança no framework**.
  Contras: `domain/errors/` importa `@/use-case` (kit de exceptions) — leve
  concessão de camada, aceita porque o boundary do kami já manda lançar HttpException.
- **Opção B: base `DomainError` pura + handler central mapeando (padrão obras).**
  Rejeitada: o obras mapeia para payload `{ message }` — **fora de escopo** (kami
  mantém `{ process, body }`); e exigiria ensinar o `UseCaseHandler` genérico a
  conhecer `DomainError`, acoplando o kit a um conceito de domínio.

## Decisão

1. **`PaginatorSchema` reutilizável** em `framework/use-case/shared/schemas/`,
   exportado por `@/use-case`. List use case compõe-o:
   `class ListUsersValidator extends BaseValidator<T, typeof PaginatorSchema> { protected schema = PaginatorSchema }`
   e deriva a entrada com `type T = Static<typeof PaginatorSchema>`. A tipagem
   compartilhada continua sendo `IPaginator`/`IPaginated<T>` do kit database. O
   `resolvePaginator` (kit database) segue dono dos **defaults** — o schema só
   valida limites (por isso sem `default` no schema). O `PaginatorSchema` aceita
   também `orderBy` (string) e `orderDirection` (`asc`|`desc`), como o
   `integrator-api`. A ordenação é aplicada pelo helper
   `resolveOrderBy(sortable, fallbackColumn, paginator)` (kit database): **só
   colunas do allowlist do módulo ordenam** — `orderBy` externo fora do allowlist
   cai no fallback, nunca vai cru pra query (evita SQLi). Cada módulo declara o
   seu allowlist (ex.: `SORTABLE_COLUMNS` em `users.database.ts`).
2. **Catálogo de erros de domínio por módulo (Opção A)** em `domain/errors/`:
   enum `<Módulo>DomainErrorType` + classe de factories que lançam a
   `HttpException` certa com o código do enum no `body`. Aplicado: `get-user-by-id`
   → `throw UsersDomainError.userNotFound()` (404, body `USER_NOT_FOUND`);
   `users.database` → `throw UsersDomainError.emailAlreadyInUse()` (409, body
   `EMAIL_ALREADY_IN_USE`). O guard interno `'Insert returned no row'` continua
   `Error` puro (invariante → 500), não é erro de negócio.
3. **Validação de negócio mora no use case, não no repositório** (ADR-021/024:
   validação só no use case). O `create-user.use-case` consulta `findByEmail` e
   lança `UsersDomainError.emailAlreadyInUse()` antes de criar; o `users.database`
   voltou a ser persistência pura (removido o try/catch de unique violation). A
   constraint `UNIQUE` do banco permanece como **backstop de integridade** — numa
   corrida concorrente rara o insert duplicado estoura (→ 500), trade-off aceito
   do check-then-act.

## Consequências Positivas

- Novo endpoint de listagem = `protected schema = PaginatorSchema` (ou composição
  com `Type.Composite`/`Type.Intersect` quando houver filtros próprios) — zero
  duplicação de `page`/`pageSize`.
- Um validador de paginação compilado e reusado por todos os list use cases.
- Erros de negócio enumerados e centralizados por módulo (`domain/errors/`);
  código do enum no `body` é contrato estável pro front, sem vazar input.

## Consequências Negativas / Trade-offs

- Tipo (`IPaginator`) e schema (`PaginatorSchema`) vivem em kits distintos; o
  alinhamento é garantido pelo typecheck no ponto de uso, não por derivação única.
- `domain/errors/` importa `@/use-case` (concessão de camada, ver Opção A).
- Cada módulo novo precisa do seu `domain/errors/<módulo>-domain-error.ts`; a
  convenção é cobrável no review (candidata a linha no `ai-review-checklist.md`).

## Critério de Revisão

Rever a Opção A se o time decidir que a paginação deve ter uma única fonte de
verdade type+schema (aí co-locar e aceitar o acoplamento a TypeBox no kit
database). Rever a convenção de erros se o produto exigir i18n de mensagens.

## Referências

- `integrator-api` (inspiração externa, ADR-023 do harness-core):
  `apps/api/src/shared/utils/typebox/schemas.ts` (`paginatorJsonSchema`),
  `.../use-cases/**/List*.ts`, exceptions em `'X not found'`/`'Email already in use'`.
- kami: `src/framework/use-case/shared/schemas/pagination.schema.ts`,
  `src/framework/database/pagination.ts` (`IPaginator`/`resolvePaginator`),
  `src/modules/users/app/list-users.use-case.ts`.
- ADR-024/025 do harness-core (TypeBox nativo; kits framework/database).
