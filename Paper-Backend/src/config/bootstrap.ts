import 'reflect-metadata'
import { container } from 'tsyringe'

import { env } from '@/config/env'
import { createDbClient, DatabaseClientSymbol } from '@/database'
import { type Db, schema } from '@/core/database'
import { JwtSessionVerifier } from '@/core/auth/jwt-session.adapter'
import { SessionVerifierSymbol } from '@/core/auth/session.port'
import { createLogger } from '@/core/logger/logger.factory'
import { LoggerSymbol } from '@/core/logger/logger.port'
import { registerUsersModule } from '@/modules/users/users.module'

export interface BootstrapOptions {
	// Permite injetar um client de banco pronto (ex.: o Postgres efêmero dos
	// testes de integração), pulando a criação a partir da DATABASE_URL.
	readonly db?: Db
}

// Composition root de DI: registra as deps de PLATAFORMA (banco, logger,
// sessão) e delega o grafo de cada módulo a registerXModule() (ADR-0003, que
// revê o composition root central do ADR-024 do harness-core). Roda uma vez.
export function bootstrap(options: BootstrapOptions = {}): void {
	const db = options.db ?? createDbClient(env.DATABASE_URL, schema)

	container.registerInstance(DatabaseClientSymbol, db)
	container.registerInstance(LoggerSymbol, createLogger(env))
	container.registerInstance(SessionVerifierSymbol, new JwtSessionVerifier(env.SESSION_SECRET))

	registerUsersModule()
}
