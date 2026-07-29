import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

import { isHttpException, ProcessOptions } from '@/use-case'
import type { Logger } from '@/core/logger/logger.port'

// Garante que toda resposta sai no formato { process, body } (contrato com o
// front — patterns/frontend.md). Resposta com o mínimo necessário (OWASP):
// nunca expõe stack/detalhe interno pro cliente.
export function buildErrorHandler(logger: Logger) {
	return function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): void {
		if (isHttpException(error)) {
			if (error.status_code >= 500) {
				logger.error(error.message, { path: request.url })
			}
			reply.status(error.status_code).send({ process: error.process, body: error.body })
			return
		}

		logger.error('Unhandled error', { message: error.message, path: request.url })
		reply.status(500).send({ process: ProcessOptions.FAILED, body: 'Erro interno' })
	}
}
