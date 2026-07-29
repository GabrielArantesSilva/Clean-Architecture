import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { ConflictException, ProcessOptions, UseCaseFactory } from '@/use-case'
import { buildLoggerMock, buildUser, buildUsersRepositoryMock } from '@/testing/support'
import { CreateUserUseCase } from '@/modules/users/app/create-user.use-case'

function build() {
	const usersRepository = buildUsersRepositoryMock()
	const logger = buildLoggerMock()
	const useCase = new CreateUserUseCase(usersRepository, logger)
	// `wrapped` roda o fluxo real: valida (@ValidateWith) -> execute -> envelope.
	return { usersRepository, logger, useCase, wrapped: UseCaseFactory.create(useCase) }
}

describe('CreateUserUseCase', () => {
	// LÓGICA (execute recebe input já validado)
	it('execute cria o usuario e loga o id', async() => {
		const { usersRepository, logger, useCase } = build()
		const user = buildUser()
		usersRepository.create.mockResolvedValue(user)

		const result = await useCase.execute({ email: user.email, name: user.name })

		expect(result).toEqual(user)
		expect(usersRepository.create).toHaveBeenCalledWith({ email: user.email, name: user.name })
		expect(logger.info).toHaveBeenCalledWith('User created', { userId: user.id })
	})

	// VALIDAÇÃO DE NEGÓCIO (e-mail único — no use case, não no banco)
	it('rejeita e nao cria quando ja existe usuario com o mesmo email', async() => {
		const { usersRepository, useCase } = build()
		usersRepository.findByEmail.mockResolvedValue(buildUser({ email: 'ana@example.com' }))

		await expect(useCase.execute({ email: 'ana@example.com', name: 'Ana' })).rejects.toBeInstanceOf(ConflictException)
		expect(usersRepository.findByEmail).toHaveBeenCalledWith('ana@example.com')
		expect(usersRepository.create).not.toHaveBeenCalled()
	})

	// ENVELOPE (handle embrulha o sucesso)
	it('handle embrulha o sucesso em { process: success, body }', async() => {
		const { usersRepository, wrapped } = build()
		const user = buildUser()
		usersRepository.create.mockResolvedValue(user)

		const response = await wrapped.handle({ email: user.email, name: user.name })

		expect(response.process).toBe(ProcessOptions.SUCCESS)
		expect(response.body).toEqual(user)
	})

	// VALIDAÇÃO (só no use case, via @ValidateWith — nunca toca o banco)
	it('handle rejeita e-mail invalido com 400 sem chamar o banco', async() => {
		const { usersRepository, wrapped } = build()

		const response = await wrapped.handle({ email: 'nao-e-email', name: 'Ana' })

		expect(response.process).toBe(ProcessOptions.FAILED)
		expect(response.status_code).toBe(400)
		expect(usersRepository.create).not.toHaveBeenCalled()
	})

	it('handle rejeita nome com menos de 2 caracteres com 400', async() => {
		const { usersRepository, wrapped } = build()

		const response = await wrapped.handle({ email: 'ana@example.com', name: 'A' })

		expect(response.status_code).toBe(400)
		expect(usersRepository.create).not.toHaveBeenCalled()
	})
})
