import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IWrappedUseCase } from '../use-case'
import type { HandlerOptions } from './types'

// Adapta a requisição HTTP ao contrato do use case e a resposta ao envelope.
// É o único lugar (junto do error-handler) que sabe traduzir { process, body }
// — a rota nunca monta resposta na mão (boundaries.md).
export function applyUseCase<T, K>(useCase: IWrappedUseCase<T, K>, options: HandlerOptions = {}) {
	return async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		const query = (request.query ?? {}) as Record<string, unknown>
		const body = (request.body ?? {}) as Record<string, unknown>
		const params = (request.params ?? {}) as Record<string, string>
		const mappedParams = options.map_params ? options.map_params(params) : params

		const payload = { ...query, ...body }
		const data: Record<string, unknown> = options.separate_request_data
			? { data: payload, ...mappedParams }
			: { ...payload, ...mappedParams }

		// Rota autenticada: o id da sessão entra como userId (mesma regra do
		// tecnoflow) — o use case decide o que fazer com ele, nunca lê o request
		// direto (mantém o use case testável sem HTTP).
		if (request.user) {
			data.userId = request.user.id
		}

		const result = await useCase.handle(data as T)
		reply.status(result.status_code).send({ process: result.process, body: result.body })
	}
}
