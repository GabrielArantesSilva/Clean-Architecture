import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import type { IPaginated } from '@/database'
import type { IUser } from '@/core/database'
import { buildUser, buildUsersRepositoryMock } from '@/testing/support'
import { ListUsersUseCase } from '@/modules/users/app/list-users.use-case'

describe('ListUsersUseCase', () => {
	it('delega a paginacao ao repository e devolve { data, pagination }', async() => {
		const usersRepository = buildUsersRepositoryMock()
		const page: IPaginated<IUser> = {
			data: [buildUser()],
			pagination: { page: 2, pageSize: 10, totalCount: 15, totalPages: 2 }
		}
		usersRepository.listPaginated.mockResolvedValue(page)
		const useCase = new ListUsersUseCase(usersRepository)

		const result = await useCase.execute({ page: 2, pageSize: 10 })

		expect(result).toEqual(page)
		expect(usersRepository.listPaginated).toHaveBeenCalledWith({ page: 2, pageSize: 10 })
	})
})
