import { createVerifier } from 'fast-jwt'
import { UnauthorizedException } from '@/use-case'
import type { SessionPayload, SessionVerifier } from './session.port'

function isSessionPayload(value: unknown): value is SessionPayload {
	return typeof value === 'object' && value !== null && typeof (value as { userId?: unknown }).userId === 'string'
}

// Adapter de referência — token assinado HS256, mesmo segredo combinado com o
// front. Trocar de provider (ex.: sessão opaca + lookup em Redis) é só trocar
// este adapter, sem tocar no middleware nem no use case (DIP — ADR-021).
export class JwtSessionVerifier implements SessionVerifier {
	private readonly verifyToken: (token: string) => unknown

	constructor(secret: string) {
		// key string => verify síncrono; algorithms fixo em HS256 para fechar a
		// porta de algorithm-confusion (nunca aceitar "alg: none" ou RS/HS troca).
		this.verifyToken = createVerifier({ key: secret, algorithms: ['HS256'] })
	}

	verify(token: string): SessionPayload {
		try {
			const decoded = this.verifyToken(token)
			if (!isSessionPayload(decoded)) {
				throw new UnauthorizedException('Payload de sessao invalido')
			}
			return decoded
		} catch(error) {
			if (error instanceof UnauthorizedException) throw error
			throw new UnauthorizedException('Sessao invalida ou expirada')
		}
	}
}
