import { inject, injectable } from 'tsyringe'
import { Type } from 'typebox'

import type { IUser } from '@/core/database'
import { BaseValidator, Documentation, type IUseCase, ValidateWith } from '@/use-case'
import { UsersDomainError } from '../domain/errors/users-domain-error'
import { type IUsersRepository, UsersRepositorySymbol } from '../domain/ports/users-repository.port'
import { UserSchema } from '../domain/schemas/user.schema'

// T independente do schema (evita a dependência circular T<->schema).
type T = { userId: string }
type K = IUser

// Sem `request`: `userId` vem da sessão (request.user), não do cliente.
@injectable()
@Documentation({
	tags: ['Users'],
	summary: 'Retorna o usuário autenticado',
	description: 'Usuário da sessão atual (/users/me).',
	response: Type.Ref(UserSchema.$id)
})
@ValidateWith(() => GetUserByIdValidator)
export class GetUserByIdUseCase implements IUseCase<T, K> {
	constructor(
		@inject(UsersRepositorySymbol) private readonly usersRepository: IUsersRepository
	) {}

	// `userId` chega injetado pelo applyUseCase a partir do request.user (rota
	// autenticada /users/me), não do path — o schema abaixo só o exige presente.
	async execute(data: T): Promise<K> {
		const user = await this.usersRepository.findById(data.userId)
		if (!user) {
			throw UsersDomainError.userNotFound()
		}
		return user
	}
}

class GetUserByIdValidator extends BaseValidator<T, typeof GetUserByIdValidator.schema> {
	static readonly schema = Type.Object({
		userId: Type.String({ minLength: 1 })
	})

	protected schema = GetUserByIdValidator.schema
}
