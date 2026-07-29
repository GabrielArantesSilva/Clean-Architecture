import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { container } from 'tsyringe'

import { isHttpException, UnauthorizedException } from '@/use-case'

import { env } from '@/config/env'
import { type SessionVerifier, SessionVerifierSymbol } from '@/core/auth/session.port'
import { type IUsersRepository, UsersRepositorySymbol } from '@/modules/users/domain/ports/users-repository.port'

type GenericMiddleware = (req: FastifyRequest, res: FastifyReply) => Promise<void>

declare module 'fastify' {
	interface FastifyInstance {
		authenticateJwt: GenericMiddleware
	}
}

// Valida o cookie de sessão (padrão tecnoflow): verifica a assinatura via
// porta SessionVerifier, carrega o usuário do banco (sessão de alguém que não
// existe mais = 401) e anexa req.user. As deps saem do container por chamada —
// resolve lazy, depois do bootstrap. O domínio de exemplo não tem permissions;
// projetos reais preenchem a lista a partir do usuário carregado.
const authenticateJwt = async(req: FastifyRequest): Promise<void> => {
	const token = req.cookies[env.SESSION_COOKIE_NAME]
	if (!token) {
		throw new UnauthorizedException()
	}

	try {
		const verifier = container.resolve<SessionVerifier>(SessionVerifierSymbol)
		const usersRepository = container.resolve<IUsersRepository>(UsersRepositorySymbol)

		const payload = verifier.verify(token)

		const user = await usersRepository.findById(payload.userId)
		if (user === null) {
			throw new UnauthorizedException()
		}

		req.user = {
			id: user.id,
			permissions: []
		}

		return
	} catch(error) {
		if (isHttpException(error)) {
			throw error
		}
	}

	throw new UnauthorizedException()
}

// Plugin global (registrado uma vez no HttpServer): o hook onRoute lê o
// config.authMethod que o registerRoutes gravou e PREPENDE o middleware em
// onRequest — auth roda antes de qualquer outro hook da rota (ADR-021: o
// middleware valida a sessão; o controller nunca).
export const authenticate = fp((fastify: FastifyInstance) => {
	fastify.decorate('authenticateJwt', authenticateJwt)

	fastify.addHook('onRoute', (routeOptions) => {
		const authMethod = routeOptions.config?.authMethod
		if (authMethod === undefined) {
			return
		}

		const originalMiddlewares = Array.isArray(routeOptions.onRequest)
			? routeOptions.onRequest
			: routeOptions.onRequest
				? [routeOptions.onRequest]
				: []

		routeOptions.onRequest = [
			async function(req: FastifyRequest, res: FastifyReply) {
				return fastify.authenticateJwt(req, res)
			},
			...originalMiddlewares
		]
	})
})

export { authenticateJwt }
