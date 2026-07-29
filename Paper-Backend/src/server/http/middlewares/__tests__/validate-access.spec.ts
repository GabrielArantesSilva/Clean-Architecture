import { describe, expect, it } from 'vitest'
import type { FastifyRequest } from 'fastify'
import { ForbiddenException } from '@/use-case'
import { validatePermissions } from '../validate-access'

function buildRequest(user?: { id: string, permissions: readonly string[] }): FastifyRequest {
	return { user } as unknown as FastifyRequest
}

describe('validatePermissions', () => {
	it('libera quando o usuario tem UMA das permissoes exigidas', async() => {
		const request = buildRequest({ id: 'usr_1', permissions: ['read.users'] })

		await expect(validatePermissions(['read.users', 'admin'])(request)).resolves.toBeUndefined()
	})

	it('lanca ForbiddenException quando o usuario nao tem nenhuma das permissoes', async() => {
		const request = buildRequest({ id: 'usr_1', permissions: ['read.orders'] })

		await expect(validatePermissions(['read.users'])(request)).rejects.toBeInstanceOf(ForbiddenException)
	})

	it('lanca ForbiddenException quando nao ha usuario autenticado', async() => {
		await expect(validatePermissions(['read.users'])(buildRequest())).rejects.toBeInstanceOf(
			ForbiddenException
		)
	})
})
