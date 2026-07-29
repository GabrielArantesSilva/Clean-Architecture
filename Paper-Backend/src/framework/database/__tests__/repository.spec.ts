import { describe, expect, it } from 'vitest'
import { DrizzleBaseRepository } from '../repository'

// generateId é protected — a subclasse concreta expõe pro teste, como um
// repository real usaria (this.generateId({ prefix: 'usr' })).
class TestRepository extends DrizzleBaseRepository<null> {
	constructor() {
		super(null)
	}

	id(params?: { prefix?: string }): string {
		return this.generateId(params)
	}
}

describe('DrizzleBaseRepository.generateId', () => {
	const repository = new TestRepository()

	it('gera id alfanumerico de 11 caracteres sem prefixo', () => {
		expect(repository.id()).toMatch(/^[0-9A-Za-z]{11}$/)
	})

	it('prefixa com a entidade separando por underscore (contrato tecnoflow)', () => {
		expect(repository.id({ prefix: 'usr' })).toMatch(/^usr_[0-9A-Za-z]{11}$/)
	})

	it('nao repete id em geracoes consecutivas', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => repository.id()))
		expect(ids.size).toBe(1000)
	})
})
