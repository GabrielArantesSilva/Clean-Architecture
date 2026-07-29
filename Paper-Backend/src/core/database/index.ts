import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// Conteúdo de dados DESTE app (ADR-025) — schema, entities e o alias `Db`.
// O genérico (factory, transação, base repository, paginação) mora em
// framework/database e não conhece nada daqui. Num projeto novo, este módulo
// é reescrito; o framework copia intacto.
export * from './entities/user'
export * from './schema'
export { schema }

// Client Drizzle tipado com o schema DESTE app — é o tipo que módulos,
// bootstrap e testes usam (criado via createDbClient(url, schema) do framework).
export type Db = PostgresJsDatabase<typeof schema>
