import { describe, expect, it } from 'vitest'
import { getDatabaseClient } from '../client'

describe('getDatabaseClient', () => {
	it('retorna o client global quando nao ha transacao em andamento', () => {
		// getDatabaseClient é genérico — devolve o tipo que recebeu, sem depender
		// do schema do app (ADR-025).
		const fallback = { marker: 'global' }

		expect(getDatabaseClient(fallback)).toBe(fallback)
	})
})
