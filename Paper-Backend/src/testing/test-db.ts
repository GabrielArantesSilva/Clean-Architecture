import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/core/database/schema'
import type { TestDb } from './test-db.contract'

const __dirname = dirname(fileURLToPath(import.meta.url))

function splitStatements(sql: string): string[] {
	return sql
		.split(';')
		.map((stmt) => stmt.trim())
		.filter(Boolean)
}

// Adapter Drizzle do primitivo (db-testing-skill/ADR-022) — Postgres real e
// descartável via Testcontainers; nunca mock, nunca SQLite/H2.
export async function startTestDb(): Promise<TestDb<PostgresJsDatabase<typeof schema>>> {
	const container: StartedPostgreSqlContainer = await new PostgreSqlContainer('postgres:16-alpine').start()
	const url = container.getConnectionUri()

	execSync('npx drizzle-kit migrate', {
		env: { ...process.env, DATABASE_URL: url },
		stdio: 'inherit',
		cwd: join(__dirname, '..', '..')
	})

	const sql = postgres(url)
	const client = drizzle(sql, { schema })

	const seed = async(): Promise<void> => {
		const seedSql = readFileSync(join(__dirname, 'dados.sql'), 'utf8')
		for (const stmt of splitStatements(seedSql)) await sql.unsafe(stmt)
	}

	const truncate = async(): Promise<void> => {
		const tables = await sql<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'`
		const list = tables.map((t) => `"${t.tablename}"`).join(', ')
		if (list) await sql.unsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
	}

	await seed()

	return {
		url,
		client,
		seed,
		truncate,
		stop: async(): Promise<void> => {
			await sql.end()
			await container.stop()
		}
	}
}
