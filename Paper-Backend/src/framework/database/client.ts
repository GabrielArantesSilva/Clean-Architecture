import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Token de injeção (tsyringe) do client Drizzle — o bootstrap registra a
// instância concreta neste Symbol; os repositories a recebem via construtor.
// O Symbol é só um token neutro (não acopla o kit a tsyringe).
export const DatabaseClientSymbol = Symbol('DatabaseClient')

// Factory paramétrica (ADR-025): o app passa o SEU schema (core/database) e
// recebe o client tipado por ele — o kit não importa nada do app, então copia
// intacto entre projetos.
export function createDbClient<TSchema extends Record<string, unknown>>(
	databaseUrl: string,
	schema: TSchema
): PostgresJsDatabase<TSchema> {
	const sql = postgres(databaseUrl)
	return drizzle(sql, { schema })
}

// Contexto de transação (kit database) — repositories chamam getDatabaseClient()
// em vez de guardar o client direto; dentro de uma transação, devolve o client
// da tx; fora, devolve o client global. O tipo concreto do client é do app
// (core/database), então o storage guarda `unknown` e as funções públicas
// devolvem o tipo que receberam.
const txStorage = new AsyncLocalStorage<unknown>()

interface TransactionClient {
	transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>
}

export function withTransaction<TDb extends TransactionClient, T>(
	db: TDb,
	fn: (tx: TDb) => Promise<T>
): Promise<T> {
	return db.transaction((tx) => txStorage.run(tx, () => fn(tx as TDb)))
}

export function getDatabaseClient<TDb>(fallback: TDb): TDb {
	return (txStorage.getStore() as TDb | undefined) ?? fallback
}
