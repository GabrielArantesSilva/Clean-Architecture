import type { Logger, LogMeta } from './logger.port'

// Adapter de dev/test (ADR-021) — saída legível no terminal, sem dependência externa.
export class ConsoleLogAdapter implements Logger {
	debug(message: string, meta?: LogMeta): void {
		// eslint-disable-next-line no-console
		console.debug(message, meta ?? '')
	}

	info(message: string, meta?: LogMeta): void {

		console.info(message, meta ?? '')
	}

	warn(message: string, meta?: LogMeta): void {

		console.warn(message, meta ?? '')
	}

	error(message: string, meta?: LogMeta): void {

		console.error(message, meta ?? '')
	}
}
