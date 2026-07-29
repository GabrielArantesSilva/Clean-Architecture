import { inject, injectable } from 'tsyringe'
import { Type } from 'typebox'

import type { IPaginated, IPaginator } from '@/database'
import type { IUser } from '@/core/database'
import { BaseValidator, Documentation, type IUseCase, paginated, PaginatorSchema, ValidateWith } from '@/use-case'
import { type IUsersRepository, UsersRepositorySymbol } from '../domain/ports/users-repository.port'
import { UserSchema } from '../domain/schemas/user.schema'

// T independente do schema (evita a dependência circular T<->schema); reusa o
// tipo de paginação do kit, que o PaginatorSchema valida.
type T = IPaginator
type K = IPaginated<IUser>

@injectable()
@Documentation({
	tags: ['Users'],
	summary: 'Lista usuários',
	description: 'Lista paginada (page/pageSize/orderBy/orderDirection na query).',
	response: paginated(Type.Ref(UserSchema.$id))
})
@ValidateWith(() => ListUsersValidator)
export class ListUsersUseCase implements IUseCase<T, K> {
	constructor(
		@inject(UsersRepositorySymbol) private readonly usersRepository: IUsersRepository
	) {}

	async execute(data: T): Promise<K> {
		return this.usersRepository.listPaginated(data)
	}
}

// Entrada é só paginação: reutiliza o PaginatorSchema compartilhado do kit.
// O request da doc mora no validator (paginação vem da query string).
@Documentation({ request: ListUsersValidator.schema })
class ListUsersValidator extends BaseValidator<T, typeof ListUsersValidator.schema> {
	static readonly schema = PaginatorSchema

	protected schema = PaginatorSchema
}
