import type { FastifyInstance, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

import { ForbiddenException } from '@/use-case'

declare module 'fastify' {
	interface FastifyInstance {
		validatePermissions: typeof validatePermissions
	}
}

// Autorização por recurso (padrão tecnoflow/security-skill): a rota declara
// required_permissions; basta o usuário ter UMA delas. Roda depois do
// authenticate (append em onRequest), que é quem preenche user.permissions.
export const validatePermissions = (
	requiredPermissions: readonly string[]
) => async(req: FastifyRequest): Promise<void> => {
	const user = req.user
	if (
		user !== undefined &&
		requiredPermissions.some((permission) => user.permissions.includes(permission))
	) {
		return
	}

	throw new ForbiddenException()
}

// Plugin global: o hook onRoute lê o config.requiredPermissions gravado pelo
// registerRoutes e APENDA o validador em onRequest (depois do auth).
export const validateAccess = fp((fastify: FastifyInstance) => {
	fastify.decorate('validatePermissions', validatePermissions)

	fastify.addHook('onRoute', (routeOptions) => {
		const requiredPermissions = routeOptions.config?.requiredPermissions
		if (requiredPermissions === undefined || requiredPermissions.length === 0) {
			return
		}

		const existing = Array.isArray(routeOptions.onRequest)
			? routeOptions.onRequest
			: routeOptions.onRequest
				? [routeOptions.onRequest]
				: []

		routeOptions.onRequest = [
			...existing,
			async(req: FastifyRequest) => {
				return fastify.validatePermissions(requiredPermissions)(req)
			}
		]
	})
})
