import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/core/database/schema'
import { startTestDb } from '@/testing/test-db'
import type { TestDb } from '@/testing/test-db.contract'
import { UsersDatabase } from '@/modules/users/infrastructure/database/users.database'

let db: TestDb<PostgresJsDatabase<typeof schema>>
let usersDatabase: UsersDatabase

beforeAll(async() => {
	db = await startTestDb()
	usersDatabase = new UsersDatabase(db.client)
}, 60_000)

afterAll(async() => {
	await db.stop()
})

beforeEach(async() => {
	await db.truncate()
	await db.seed()
})

describe('users.database', () => {
	// 1. CAMINHO FELIZ
	it('create + findById retorna o usuario criado', async() => {
		const created = await usersDatabase.create({ email: 'nova@example.com', name: 'Nova' })

		const found = await usersDatabase.findById(created.id)

		expect(found?.email).toBe('nova@example.com')
	})

	// 2. CENARIOS DE NEGACAO
	it('findById retorna null quando o id nao existe — nao lanca', async() => {
		const found = await usersDatabase.findById('99999999-9999-9999-9999-999999999999')
		expect(found).toBeNull()
	})

	it('findByEmail retorna null quando o email nao existe', async() => {
		const found = await usersDatabase.findByEmail('ninguem@example.com')
		expect(found).toBeNull()
	})

	// A validação de negócio (e-mail único) mora no use case; aqui prova-se que a
	// constraint UNIQUE do banco continua sendo o backstop de integridade.
	it('create rejeita duplicado — constraint unique do banco (integridade)', async() => {
		await expect(usersDatabase.create({ email: 'ana@example.com', name: 'Outra Ana' })).rejects.toThrow()
	})

	// 3. QUERY PERIGOSA — prova pelo que NAO foi tocado
	it('deleteById apaga so o registro do id — os demais sobrevivem', async() => {
		const totalAntes = await usersDatabase.count()

		await usersDatabase.deleteById('11111111-1111-1111-1111-111111111111')

		const totalDepois = await usersDatabase.count()
		const outroSeedAindaExiste = await usersDatabase.findById('22222222-2222-2222-2222-222222222222')

		expect(totalDepois).toBe(totalAntes - 1)
		expect(outroSeedAindaExiste).not.toBeNull()
	})

	// 4. PAGINACAO — a pagina respeita o limite e o total conta TODOS os registros
	it('listPaginated devolve so a pagina pedida mas conta o total real', async() => {
		const primeiraPagina = await usersDatabase.listPaginated({ page: 1, pageSize: 1 })

		expect(primeiraPagina.data).toHaveLength(1)
		expect(primeiraPagina.pagination).toEqual({ page: 1, pageSize: 1, totalCount: 2, totalPages: 2 })
	})

	it('listPaginated na segunda pagina traz um registro diferente da primeira', async() => {
		const p1 = await usersDatabase.listPaginated({ page: 1, pageSize: 1 })
		const p2 = await usersDatabase.listPaginated({ page: 2, pageSize: 1 })

		expect(p1.data[0]?.id).not.toBe(p2.data[0]?.id)
	})

	// 5. ORDENACAO — orderBy/orderDirection respeitados via allowlist
	it('listPaginated ordena por name asc e desc', async() => {
		const asc = await usersDatabase.listPaginated({ orderBy: 'name', orderDirection: 'asc' })
		const desc = await usersDatabase.listPaginated({ orderBy: 'name', orderDirection: 'desc' })

		expect(asc.data.map(u => u.name)).toEqual(['Ana Seed', 'Bruno Seed'])
		expect(desc.data.map(u => u.name)).toEqual(['Bruno Seed', 'Ana Seed'])
	})

	it('orderBy fora do allowlist cai no fallback — nao lanca nem injeta SQL', async() => {
		const result = await usersDatabase.listPaginated({ orderBy: 'name); DROP TABLE users; --', orderDirection: 'asc' })

		expect(result.data).toHaveLength(2)
	})
})
