import { container } from 'tsyringe'
import type { FastifyInstance, FastifySchema } from 'fastify'
import fp from 'fastify-plugin'

import { type IDocumentation, UseCaseFactory } from '../use-case'

import { applyUseCase } from './apply-use-case'
import type { IRoute } from './types'

type IRouteOptions = {
	group?: string
}

// Schema Fastify só para documentação (o @fastify/swagger lê daqui; validação e
// serialização ficam desligadas no app). request -> body/querystring; response
// embrulha o envelope { process, body }; auth_method marca o security de cookie.
const buildRouteSchema = (doc: IDocumentation, method: IRoute['method'], authed: boolean): FastifySchema => {
	const schema: FastifySchema = {
		tags: doc.tags,
		summary: doc.summary,
		description: doc.description,
		security: authed ? [{ cookieAuth: [] }] : [],
		response: {
			'2xx': {
				type: 'object',
				required: ['process', 'body'],
				properties: {
					process: { type: 'string', enum: ['success'] },
					body: doc.response ?? { type: 'object' }
				}
			},
			'4xx': {
				type: 'object',
				required: ['process', 'body'],
				properties: {
					process: { type: 'string', enum: ['failed'] },
					body: { type: 'string' }
				}
			}
		}
	}
	if (doc.request !== undefined) {
		if (method === 'get' || method === 'delete') {
			schema.querystring = doc.request
		} else {
			schema.body = doc.request
		}
	}
	return schema
}

// Traduz rotas-dado (IRoute[]) em fastify.route() — mesmo mecanismo do
// tecnoflow: resolve o use case do container (tsyringe), embrulha com o
// UseCaseFactory (que lê @ValidateWith/@Documentation via reflect-metadata) e
// grava `config` (authMethod/requiredPermissions) pros middlewares do app
// lerem via hook onRoute. Exige o container já inicializado (bootstrap).
// Nota: o tecnoflow ainda troca o handler por applyAuthUseCase quando
// handler_options tem manage_auth_cookies (login/refresh grava cookies) — o
// template não tem bounded context de auth, então o fork não existe aqui.
export const registerRoutes = (
	routes: readonly IRoute[],
	options: IRouteOptions = {}
) => fp((fastify: FastifyInstance) => {
	const { group } = options

	for (const route of routes) {
		const { method, path, use_case_class, handler_options } = route

		const use_case = UseCaseFactory.create(container.resolve(use_case_class))

		let url = (group || '') + path
		if (url.endsWith('/')) {
			url = url.slice(0, -1)
		}

		fastify.route({
			method,
			url,
			config: {
				authMethod: route.auth_method,
				requiredPermissions: route.required_permissions
			},
			schema: use_case.documentation
				? buildRouteSchema(use_case.documentation, method, route.auth_method !== undefined)
				: undefined,
			handler: applyUseCase(use_case, handler_options)
		})
	}
})
