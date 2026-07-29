import 'reflect-metadata'
import { beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { mock } from 'vitest-mock-extended'
import { bootstrap } from '@/config/bootstrap'
import type { Db } from '@/core/database'
import { HttpServer } from '../app'

type Operation = {
	summary?: string
	tags?: string[]
	security?: unknown
	parameters?: { name: string, in: string }[]
	requestBody?: unknown
}
type OpenApiDoc = {
	paths: Record<string, Record<string, Operation>>
	components?: { schemas?: Record<string, unknown> }
}

let doc: OpenApiDoc

beforeAll(async() => {
	bootstrap({ db: mock<Db>() })
	// Boota o HttpServer real (swagger + scalar + addSchema + rotas) e lê o doc.
	const server = new HttpServer()
	const app = (server as unknown as { app: FastifyInstance }).app
	await app.ready()
	doc = app.swagger() as unknown as OpenApiDoc
	await server.stop()
})

describe('OpenAPI via @Documentation (HttpServer real)', () => {
	it('gera operações a partir do @Documentation dos use cases', () => {
		expect(doc.paths['/users']?.post?.summary).toBe('Cria um usuário')
		expect(doc.paths['/users']?.post?.tags).toContain('Users')
		expect(doc.paths['/users']?.get?.summary).toBe('Lista usuários')
		expect(doc.paths['/users/me']?.get?.summary).toBe('Retorna o usuário autenticado')
	})

	it('request do validator vira body (POST) e query params (GET)', () => {
		expect(doc.paths['/users']?.post?.requestBody).toBeDefined()
		const listParams = doc.paths['/users']?.get?.parameters?.map((p) => p.name) ?? []
		expect(listParams).toEqual(expect.arrayContaining(['page', 'pageSize', 'orderBy', 'orderDirection']))
		// /users/me não documenta request — userId vem da sessão, não do cliente
		expect(doc.paths['/users/me']?.get?.requestBody).toBeUndefined()
		expect(doc.paths['/users/me']?.get?.parameters ?? []).toEqual([])
	})

	it('security de cookie só nas rotas autenticadas', () => {
		expect(doc.paths['/users/me']?.get?.security).toEqual([{ cookieAuth: [] }])
		expect(doc.paths['/users']?.get?.security).toEqual([{ cookieAuth: [] }])
		expect(doc.paths['/users']?.post?.security).toEqual([])
	})

	it('schemas nomeados por $id viram componentes ($ref resolve)', () => {
		expect(doc.components?.schemas?.['entities.User']).toBeDefined()
		expect(doc.components?.schemas?.['objects.Pagination']).toBeDefined()
	})

	it('rotas internas (/health, /openapi.json) ficam fora do doc', () => {
		expect(doc.paths['/health']).toBeUndefined()
		expect(doc.paths['/openapi.json']).toBeUndefined()
	})
})
