import 'reflect-metadata'
import { beforeAll, describe, expect, it } from 'vitest'
import { container } from 'tsyringe'
import { mock } from 'vitest-mock-extended'
import { bootstrap } from '@/config/bootstrap'
import type { Db } from '@/core/database'
import { CreateUserUseCase } from '@/modules/users/app/create-user.use-case'
import { GetUserByIdUseCase } from '@/modules/users/app/get-user-by-id.use-case'

// Smoke test de wiring (padrão tecnoflow): garante que o bootstrap registra
// tudo que os use cases pedem por @inject. Um Symbol esquecido no bootstrap
// estoura aqui (`Cannot resolve dependency`), não em produção.
beforeAll(() => {
	bootstrap({ db: mock<Db>() })
})

describe('users — DI wiring', () => {
	it('resolve CreateUserUseCase com todas as deps', () => {
		expect(() => container.resolve(CreateUserUseCase)).not.toThrow()
	})

	it('resolve GetUserByIdUseCase com todas as deps', () => {
		expect(() => container.resolve(GetUserByIdUseCase)).not.toThrow()
	})
})
