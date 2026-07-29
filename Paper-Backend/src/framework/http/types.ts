import type { IUseCase } from '../use-case'

// Métodos de autenticação aceitos pelas rotas (padrão tecnoflow). O template
// só traz 'jwt' (cookie de sessão); projetos reais estendem a union (ex.:
// 'steps' para chave de API, 'any' para Promise.any dos dois).
export type AuthenticationMethods = 'jwt'

// Usuário autenticado anexado ao request pelo middleware de auth do app
// (mesmo shape do tecnoflow). O augment mora aqui (não em core/auth) pra o
// kit http ser autocontido — quem seta request.user só precisa ser
// estruturalmente compatível.
export interface AuthenticatedUser {
	readonly id: string
	readonly permissions: readonly string[]
}

declare module 'fastify' {
	interface FastifyRequest {
		user?: AuthenticatedUser
	}

	// Contrato do config por rota: o registerRoutes grava; os middlewares do
	// app (authenticate/validate-access) leem via hook onRoute.
	interface FastifyContextConfig {
		authMethod?: AuthenticationMethods
		requiredPermissions?: readonly string[]
	}
}

// O registry de rotas é heterogêneo (cada use case tem seu próprio T/K), então
// o token aceita qualquer use case. É a única fronteira onde o genérico abre.
// `...args: any[]` (não `never[]`) casa com o `constructor<T>` do tsyringe, que
// é o que deixa passar a classe do use case como InjectionToken pro container.
export type AnyUseCase = IUseCase<unknown, unknown>
// eslint-disable-next-line typescript/no-explicit-any
export type UseCaseClass = new (...args: any[]) => AnyUseCase

export interface HandlerOptions {
	// Reempacota o payload como { data: <body+query> } em vez de espalhar os campos
	// na raiz — útil em PATCH/PUT onde o use case separa "quem" (userId) de "o quê".
	readonly separate_request_data?: boolean
	// Transforma os path params antes de mesclar (ex.: renomear :id -> resourceId).
	readonly map_params?: (params: Record<string, string>) => Record<string, unknown>
}

// Rota como dado puro (ADR-024, mesmo shape do tecnoflow) — o registerRoutes
// traduz isto em fastify.route(). "receber use cases diretamente": a rota
// aponta pra classe do use case; o container resolve, o UseCaseFactory
// embrulha, o applyUseCase adapta req/resp. Rota sem auth_method é pública.
export type IRoute = {
	method: 'post' | 'get' | 'put' | 'delete' | 'patch'
	path: string
	auth_method?: AuthenticationMethods
	required_permissions?: readonly string[]

	use_case_class: UseCaseClass
	handler_options?: HandlerOptions
}
