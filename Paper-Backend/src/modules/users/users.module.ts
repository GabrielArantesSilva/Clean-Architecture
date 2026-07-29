import { container } from 'tsyringe'
import { UsersRepositorySymbol } from './domain/ports/users-repository.port'
import { UsersDatabase } from './infrastructure/database/users.database'

// DI do bounded context (ADR-0003). Pré-requisito: as deps de plataforma já
// registradas pelo bootstrap — este registro não as declara.
export function registerUsersModule(): void {
	container.register(UsersRepositorySymbol, { useClass: UsersDatabase })
}
