import 'reflect-metadata'
import { container } from 'tsyringe'
import { bootstrap } from '@/config/bootstrap'
import { type Logger, LoggerSymbol } from '@/core/logger/logger.port'
import { HttpServer } from './http/app'
import { gracefulShutdown } from './shutdown'
import type { IServer } from './types'

// Entrypoint do processo — ponto único de orquestração dos servers (padrão
// tecnoflow). Hoje só o HTTP; amanhã um QueueServer (BullMQ) entra na lista,
// reusando o mesmo container e os mesmos use cases (UseCaseFactory), sem
// duplicar wiring. bootstrap() roda antes de instanciar qualquer server.
bootstrap()

const logger = container.resolve<Logger>(LoggerSymbol)
const servers: readonly IServer[] = [new HttpServer()]

for (const server of servers) {
	await server.start()
}

process.on('SIGTERM', () => void gracefulShutdown(servers, logger))
process.on('SIGINT', () => void gracefulShutdown(servers, logger))
