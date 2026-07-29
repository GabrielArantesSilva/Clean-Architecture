import cookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'
import Fastify, { type FastifyInstance } from 'fastify'
import { container } from 'tsyringe'

import { env } from '@/config/env'
import { type Logger, LoggerSymbol } from '@/core/logger/logger.port'
import { PaginationSchema, ProcessOptions } from '@/use-case'
import { registerRoutes } from '@/http'
import { UserSchema } from '@/modules/users/domain/schemas/user.schema'
import { usersRoutes } from '@/modules/users/users.routes'
import type { IServer } from '../types'
import { buildErrorHandler } from './error-handler'
import { authenticate } from './middlewares/authenticate'
import { validateAccess } from './middlewares/validate-access'

// Servidor HTTP como classe (padrão tecnoflow): o constructor monta o Fastify
// (plugins -> middlewares -> rotas -> error handler) e start()/stop() controlam
// o ciclo de vida. Pressupõe o container já inicializado (bootstrap()): resolve
// o logger e os use cases de lá. Registrar um grupo novo de rotas é uma linha
// em addRoutes() — nada mais muda aqui.
export class HttpServer implements IServer {
	private readonly app: FastifyInstance
	private readonly logger: Logger
	private readonly port = env.PORT

	constructor() {
		this.app = Fastify({ logger: false })
		this.logger = container.resolve<Logger>(LoggerSymbol)
		this.addPlugins()
		this.addMiddlewares()
		this.addRoutes()
		this.app.setErrorHandler(buildErrorHandler(this.logger))
	}

	private addPlugins(): void {
		void this.app.register(cookie)

		// Validação e serialização só no use case (ADR-021) — desliga os compilers
		// do Fastify; o schema das rotas fica só para documentação (swagger).
		this.app.addHook('onRoute', (routeOptions) => {
			routeOptions.validatorCompiler = () => () => true
			routeOptions.serializerCompiler = () => (data) => JSON.stringify(data)
		})

		// Componentes compartilhados do OpenAPI (referenciados por Type.Ref($id)).
		this.app.addSchema(UserSchema)
		this.app.addSchema(PaginationSchema)

		void this.app.register(swagger, {
			// Usa o $id do schema como nome do componente (senão o swagger gera def-N).
			refResolver: { buildLocalReference: (json) => String(json.$id) },
			openapi: {
				info: {
					title: 'kami-backend',
					description: 'Implementação de referência do back-end Origami (OpenAPI via @Documentation).',
					version: '0.1.0'
				},
				components: {
					securitySchemes: {
						cookieAuth: { type: 'apiKey', in: 'cookie', name: env.SESSION_COOKIE_NAME }
					}
				}
			}
		})
		void this.app.register(scalar, { routePrefix: '/reference' })
	}

	private addMiddlewares(): void {
		// Plugins globais com hook onRoute (padrão tecnoflow): leem o `config`
		// gravado pelo registerRoutes (authMethod/requiredPermissions) e ligam
		// os middlewares por rota — nenhuma rota referencia middleware direto.
		void this.app.register(authenticate)
		void this.app.register(validateAccess)
	}

	private addRoutes(): void {
		this.app.get('/health', { schema: { hide: true } }, async() => ({ process: ProcessOptions.SUCCESS, body: { status: 'ok' } }))

		// Documento OpenAPI gerado dos @Documentation das rotas; UI em /reference.
		this.app.get('/openapi.json', { schema: { hide: true } }, async() => this.app.swagger())

		void this.app.register(registerRoutes(usersRoutes, { group: '/users' }))
	}

	async start(): Promise<void> {
		try {
			await this.app.listen({ port: this.port, host: '0.0.0.0' })
			this.logger.info(`HTTP server listening on port ${this.port}`)
		} catch(error) {
			this.logger.error('Failed to start HTTP server', { error })
			process.exit(1)
		}
	}

	async stop(): Promise<void> {
		await this.app.close()
		this.logger.info('HTTP server stopped')
	}
}
