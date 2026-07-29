import 'reflect-metadata'
import { beforeEach, describe, expect, it } from 'vitest'
import { container } from 'tsyringe'
import type { FastifyRequest } from 'fastify'
import { UnauthorizedException } from '@/use-case'
import { type SessionVerifier, SessionVerifierSymbol } from '@/core/auth/session.port'
import { UsersRepositorySymbol } from '@/modules/users/domain/ports/users-repository.port'
import { buildUser, buildUsersRepositoryMock } from '@/testing/support'
import { authenticateJwt } from '../authenticate'

// O authenticateJwt resolve as deps do container por chamada — o teste registra
// os mocks direto nos Symbols (mesmo mecanismo do bootstrap).
function build(overrides: { verify?: () => { userId: string } } = {}) {
	const usersRepository = buildUsersRepositoryMock()
	const verifier: SessionVerifier = {
		verify: overrides.verify ?? (() => ({ userId: 'usr_1' }))
	}
	container.registerInstance(UsersRepositorySymbol, usersRepository)
	container.registerInstance(SessionVerifierSymbol, verifier)
	return { usersRepository }
}

function buildRequest(cookies: Record<string, string> = {}): FastifyRequest {
	return { cookies } as unknown as FastifyRequest
}

beforeEach(() => {
	container.clearInstances()
	process.env['SESSION_COOKIE_NAME'] = 'session'
})

describe('authenticateJwt', () => {
	it('anexa req.user quando o cookie e valido e o usuario existe', async() => {
		const { usersRepository } = build()
		const user = buildUser({ id: 'usr_1' })
		usersRepository.findById.mockResolvedValue(user)
		const request = buildRequest({ session: 'token-valido' })

		await authenticateJwt(request)

		expect(request.user).toEqual({ id: 'usr_1', permissions: [] })
		expect(usersRepository.findById).toHaveBeenCalledWith('usr_1')
	})

	it('lanca UnauthorizedException sem cookie de sessao', async() => {
		build()

		await expect(authenticateJwt(buildRequest())).rejects.toBeInstanceOf(UnauthorizedException)
	})

	it('lanca UnauthorizedException quando a assinatura e invalida', async() => {
		build({
			verify: () => {
				throw new UnauthorizedException('Sessao invalida ou expirada')
			}
		})

		await expect(authenticateJwt(buildRequest({ session: 'forjado' }))).rejects.toBeInstanceOf(
			UnauthorizedException
		)
	})

	it('lanca UnauthorizedException quando a sessao aponta pra usuario que nao existe mais', async() => {
		const { usersRepository } = build()
		usersRepository.findById.mockResolvedValue(null)

		await expect(authenticateJwt(buildRequest({ session: 'token-valido' }))).rejects.toBeInstanceOf(
			UnauthorizedException
		)
	})
})
