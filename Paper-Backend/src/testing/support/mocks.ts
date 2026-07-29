import { mock, type MockProxy } from 'vitest-mock-extended'
import type { Logger } from '@/core/logger/logger.port'
import type { IUsersRepository } from '@/modules/users/domain/ports/users-repository.port'

// Mocks auto-gerados (ADR-021/qa-skill): vitest-mock-extended cria todos os
// métodos da interface como spies assertáveis. Adicionar um método na interface
// do repository não quebra spec algum — o mock ganha o método sozinho. O teste
// só configura o retorno do que usa (repo.findById.mockResolvedValue(...)).
export function buildUsersRepositoryMock(): MockProxy<IUsersRepository> {
	return mock<IUsersRepository>()
}

export function buildLoggerMock(): MockProxy<Logger> {
	return mock<Logger>()
}
