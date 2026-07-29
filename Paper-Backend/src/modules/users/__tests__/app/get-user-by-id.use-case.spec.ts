import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { NotFoundException } from '@/use-case'
import { buildUser, buildUsersRepositoryMock } from '@/testing/support'
import { GetUserByIdUseCase } from '@/modules/users/app/get-user-by-id.use-case'

function build() {
	const usersRepository = buildUsersRepositoryMock()
	return { usersRepository, useCase: new GetUserByIdUseCase(usersRepository) }
}

describe('GetUserByIdUseCase', () => {
	it('retorna o usuario quando ele existe (userId da sessao)', async() => {
		const { usersRepository, useCase } = build()
		const user = buildUser()
		usersRepository.findById.mockResolvedValue(user)

		const result = await useCase.execute({ userId: user.id })

		expect(result).toEqual(user)
		expect(usersRepository.findById).toHaveBeenCalledWith(user.id)
	})

	it('lanca NotFoundException quando o usuario nao existe — nao retorna null', async() => {
		const { usersRepository, useCase } = build()
		usersRepository.findById.mockResolvedValue(null)

		await expect(useCase.execute({ userId: 'inexistente' })).rejects.toBeInstanceOf(NotFoundException)
	})
})
