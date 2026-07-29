import type { Env } from '@/config/env'
import { ConsoleLogAdapter } from './console-log.adapter'
import type { Logger } from './logger.port'
import { PinoLoggerAdapter } from './pino-logger.adapter'

// Injeção de dependência da porta de log (ADR-021): prod -> Pino, dev/test -> Console.
export function createLogger(env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>): Logger {
	if (env.NODE_ENV === 'production') {
		return new PinoLoggerAdapter(env.LOG_LEVEL)
	}
	return new ConsoleLogAdapter()
}
