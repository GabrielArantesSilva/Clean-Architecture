# Kit `framework/database/`

Acesso a dados com Drizzle (Postgres) — **só o genérico** (ADR-025): factory
paramétrica, contexto de transação, base de repository e paginação. O kit não
importa nada do app, então copia intacto entre projetos.

O conteúdo de dados do app mora em **`core/database/`**: `schema.ts`, `entities/`
e o alias `Db` (client tipado pelo schema DESTE app). A interface
`I<X>Repository` + Symbol moram no módulo do bounded context (boundaries.md).

## Layout

```
framework/database/
  index.ts          barrel do kit
  client.ts         createDbClient<TSchema>(url, schema) — paramétrica;
                    DatabaseClientSymbol; withTransaction/getDatabaseClient
                    (contexto via AsyncLocalStorage)
  repository.ts     DrizzleBaseRepository<TDb> — this.drizzleClient + paginatedQuery()
                    + generateId({ prefix }) (id curto prefixado, contrato tecnoflow)
  helpers.ts        generateRandomId (nanoid, alfabeto 62, 11 posições)
  pagination.ts     IPaginator/IPagination/IPaginated + resolvePaginator/buildPagination

core/database/      (do app — reescreve por projeto)
  schema.ts         schema Drizzle (fonte única; drizzle.config.ts aponta pra cá)
  entities/         tipos de domínio (IUser-like)
  index.ts          alias `Db = PostgresJsDatabase<typeof schema>` + re-exports
```

## Como o app se liga ao kit

```ts
// config/bootstrap.ts — o app instancia o kit com o SEU schema
import { createDbClient, DatabaseClientSymbol } from '@/database'
import { type Db, schema } from '@/core/database'

const db = createDbClient(env.DATABASE_URL, schema)   // PostgresJsDatabase<typeof schema>
container.registerInstance(DatabaseClientSymbol, db)
```

## Repository: interface no módulo, impl herda a base

```ts
// modules/users/users.repository.ts
export interface IUsersRepository { findById(id: string): Promise<IUser | null> /* ... */ }
export const UsersRepositorySymbol = Symbol('IUsersRepository')

// modules/users/users.database.ts  (*.database.ts => testado com Postgres real)
@injectable()
export class UsersDatabase extends DrizzleBaseRepository<Db> implements IUsersRepository {
  constructor(@inject(DatabaseClientSymbol) db: Db) { super(db) }
  async findById(id: string) { /* this.drizzleClient.select()... */ }
}
```

`this.drizzleClient` resolve o client da transação corrente se houver (via
`AsyncLocalStorage`), senão o global — o repository não precisa saber se está
dentro de um `withTransaction(...)`.

## Paginação

O repository informa **como** buscar a página (`rows(limit, offset)`) e **como**
contar (`count()`); o kit calcula limit/offset e monta `{ data, pagination }`.
`rows` e `count` rodam em paralelo.

```ts
async listPaginated(paginator: IPaginator): Promise<IPaginated<IUser>> {
  return this.paginatedQuery<IUser>({
    paginator,
    rows: async (limit, offset) => this.drizzleClient.select().from(users)
      .orderBy(users.createdAt).limit(limit).offset(offset),
    count: () => this.count(),
  })
}
```

`page`/`pageSize` chegam como string na query — o `BaseValidator` (kit use-case)
os coage a number antes do use case ver (ver `ListUsersUseCase`).

## Como adicionar um repository

1. Tabela em `core/database/schema.ts` + migration (`pnpm db:generate`).
2. Entity em `core/database/entities/` (re-exportada no index de core/database).
3. `I<X>Repository` + `<X>RepositorySymbol` no módulo do bounded context.
4. `<X>Database extends DrizzleBaseRepository<Db>`, `@injectable()`.
5. `container.register(<X>RepositorySymbol, { useClass: <X>Database })` no bootstrap.
6. `x.database.spec.ts` com Postgres real (ver `testing/README.md`).

## IDs — gerado pelo app vs gerado pelo banco

`this.generateId({ prefix: 'usr' })` gera `usr_a1B2c3D4e5F` (nanoid 11, mesmo
contrato do tecnoflow: `usr_`, `ord_`, `orddoc_`...). Exige coluna
`varchar`/`text` e o `create` do repository passando o id. O módulo de exemplo
(`users`) usa a outra estratégia válida — `uuid` com `defaultRandom()` no banco
— então não chama `generateId`; escolha UMA por entidade e seja consistente.

## Gotchas

- Migration nunca à mão: `pnpm db:generate` + `pnpm db:migrate`.
- `count()` usa o `count()` do drizzle (SQL `COUNT`) — não traga a tabela
  inteira para contar.
- Erro de unique violation vem embrulhado pelo drizzle (`DrizzleQueryError`); o
  código `23505` está no `cause` — veja `isUniqueViolation` em `users.database.ts`.
- Entity nova de bounded context mora em `core/database/entities/`, não dentro
  do módulo — evita import cruzado entre módulos (o análogo do
  `packages/shared-types` do tecnoflow).
