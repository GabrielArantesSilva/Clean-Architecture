import type { Logger } from '@/core/logger/logger.port'
import type { IServer } from './types'

// Encerramento gracioso (padrão tecnoflow): para todos os servers em paralelo
// e só então derruba o processo — conexões em andamento terminam limpas.
export async function gracefulShutdown(servers: readonly IServer[], logger: Logger): Promise<void> {
	logger.info('Shutting down servers...')
	await Promise.all(servers.map((server) => server.stop()))
	process.exit(0)
}
