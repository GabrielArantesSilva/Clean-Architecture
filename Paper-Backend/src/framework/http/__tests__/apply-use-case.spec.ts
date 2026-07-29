import { describe, expect, it, vi } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { type IWrappedUseCase, ProcessOptions, SuccessResponse } from '../../use-case'
import { applyUseCase } from '../apply-use-case'
import type { HandlerOptions } from '../types'

// Testa só a adaptação request -> input do use case -> envelope; o use case em
// si é um stub que devolve o que recebeu (para inspecionar o data montado).
function build(options: HandlerOptions = {}) {
	const handle = vi.fn(async(data: unknown) => new SuccessResponse(data))
	const wrapped: IWrappedUseCase<unknown, unknown> = { handle }
	const status = vi.fn().mockReturnThis()
	const send = vi.fn()
	const reply = { status, send } as unknown as FastifyReply
	const handler = applyUseCase(wrapped, options)
	return { handle, status, send, reply, handler }
}

function buildRequest(overrides: Partial<Record<'query' | 'body' | 'params' | 'user', unknown>> = {}): FastifyRequest {
	return { query: {}, body: {}, params: {}, ...overrides } as FastifyRequest
}

describe('applyUseCase', () => {
	it('mescla query, body e params na raiz do input', async() => {
		const { handle, handler, reply } = build()
		const request = buildRequest({
			query: { page: '2' },
			body: { name: 'Ana' },
			params: { id: 'r1' }
		})

		await handler(request, reply)

		expect(handle).toHaveBeenCalledWith({ page: '2', name: 'Ana', id: 'r1' })
	})

	it('injeta userId a partir do request.user.id em rota autenticada (shape tecnoflow)', async() => {
		const { handle, handler, reply } = build()
		const request = buildRequest({ user: { id: 'usr_1', permissions: [] } })

		await handler(request, reply)

		expect(handle).toHaveBeenCalledWith({ userId: 'usr_1' })
	})

	it('separate_request_data reempacota o payload em { data } mantendo params na raiz', async() => {
		const { handle, handler, reply } = build({ separate_request_data: true })
		const request = buildRequest({
			body: { name: 'Novo Nome' },
			params: { id: 'r1' },
			user: { id: 'usr_1', permissions: [] }
		})

		await handler(request, reply)

		expect(handle).toHaveBeenCalledWith({ data: { name: 'Novo Nome' }, id: 'r1', userId: 'usr_1' })
	})

	it('map_params transforma os path params antes de mesclar', async() => {
		const { handle, handler, reply } = build({ map_params: (params) => ({ resourceId: params['id'] }) })
		const request = buildRequest({ params: { id: 'r1' } })

		await handler(request, reply)

		expect(handle).toHaveBeenCalledWith({ resourceId: 'r1' })
	})

	it('responde status_code e o envelope { process, body } do resultado', async() => {
		const { handler, reply, status, send } = build()
		const request = buildRequest({ body: { name: 'Ana' } })

		await handler(request, reply)

		expect(status).toHaveBeenCalledWith(200)
		expect(send).toHaveBeenCalledWith({ process: ProcessOptions.SUCCESS, body: { name: 'Ana' } })
	})
})
