export interface SessionPayload {
	readonly userId: string
}

// Porta de verificação de sessão (DIP). O front grava o cookie assinado;
// o back só valida — nunca emite sessão (ADR-021/patterns/frontend.md).
export interface SessionVerifier {
	verify(token: string): SessionPayload
}

// Token de injeção (tsyringe) — o bootstrap registra o adapter concreto
// (JwtSessionVerifier); o middleware authenticate resolve daqui.
export const SessionVerifierSymbol = Symbol('SessionVerifier')
