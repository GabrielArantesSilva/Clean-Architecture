import { inject, injectable } from 'tsyringe'
import { Type } from 'typebox'

import type { IUser } from '@/core/database'
import { BaseValidator, Documentation, type IUseCase, ValidateWith } from '@/use-case'
import { type Logger, LoggerSymbol } from '@/core/logger/logger.port'
import { UsersDomainError } from '../domain/errors/users-domain-error'
import { type ICreateUserParams, type IUsersRepository, UsersRepositorySymbol } from '../domain/ports/users-repository.port'
import { UserSchema } from '../domain/schemas/user.schema'

// T definido independente do schema (evita a dependência circular T<->schema); o
// BaseValidator<T extends Static<S>, S> só verifica que o schema cobre o T.
type T = ICreateUserParams
type K = IUser

@injectable()
@Documentation({
	tags: ['Users'],
	summary: 'Cria um usuário',
	description: 'Cria um usuário novo; e-mail único (409 se já cadastrado).',
	response: Type.Ref(UserSchema.$id)
})
@ValidateWith(() => CreateUserValidator)
export class CreateUserUseCase implements IUseCase<T, K> {
	constructor(
		@inject(UsersRepositorySymbol) private readonly usersRepository: IUsersRepository,
		@inject(LoggerSymbol) private readonly logger: Logger
	) {}

	// Schema validado pelo BaseValidator (@ValidateWith); a regra de negócio
	// (e-mail único) é validada aqui, no use case — não na camada de dados.
	async execute(data: T): Promise<K> {
		const existing = await this.usersRepository.findByEmail(data.email)
		if (existing) {
			throw UsersDomainError.emailAlreadyInUse()
		}

		const user = await this.usersRepository.create(data)
		this.logger.info('User created', { userId: user.id })
		return user
	}
}

// O request da doc mora no validator (o schema que valida a entrada do cliente);
// o `static readonly schema` é a fonte única — sem const solta no módulo.
@Documentation({ request: CreateUserValidator.schema })
class CreateUserValidator extends BaseValidator<T, typeof CreateUserValidator.schema> {
	static readonly schema = Type.Pick(UserSchema, ['email', 'name'])

	protected schema = CreateUserValidator.schema
}
