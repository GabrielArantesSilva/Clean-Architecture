export interface LogMeta {
	readonly [key: string]: unknown
}

// Porta de log (DIP — ADR-021). Código de negócio depende desta interface,
// nunca de console/pino direto.
export interface Logger {
	debug(message: string, meta?: LogMeta): void
	info(message: string, meta?: LogMeta): void
	warn(message: string, meta?: LogMeta): void
	error(message: string, meta?: LogMeta): void
}

// Token de injeção (tsyringe) — o bootstrap registra o adapter concreto
// (Pino/Console) neste Symbol; use cases pedem `@inject(LoggerSymbol)`.
export const LoggerSymbol = Symbol('Logger')
