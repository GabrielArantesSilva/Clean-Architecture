import pino, { type Logger as PinoInstance } from 'pino'
import type { Logger, LogMeta } from './logger.port'

// Adapter de produção (ADR-021) — formato estruturado, sem dados sensíveis em log
// (boundaries.md: nunca logar secrets, tokens, payload de credencial).
export class PinoLoggerAdapter implements Logger {
	private readonly pino: PinoInstance

	constructor(level: string) {
		this.pino = pino({ level })
	}

	debug(message: string, meta?: LogMeta): void {
		this.pino.debug(meta ?? {}, message)
	}

	info(message: string, meta?: LogMeta): void {
		this.pino.info(meta ?? {}, message)
	}

	warn(message: string, meta?: LogMeta): void {
		this.pino.warn(meta ?? {}, message)
	}

	error(message: string, meta?: LogMeta): void {
		this.pino.error(meta ?? {}, message)
	}
}
