import { describe, expect, it } from 'vitest'
import type { Static } from 'typebox'
import { BadRequestException, BaseValidator, PaginatorSchema } from '../../../index'

type Paginator = Static<typeof PaginatorSchema>

class TestPaginatorValidator extends BaseValidator<Paginator, typeof PaginatorSchema> {
	protected schema = PaginatorSchema
}

describe('PaginatorSchema', () => {
	const validator = new TestPaginatorValidator()

	it('coage page/pageSize de query string para number (Convert)', async() => {
		const result = await validator.validate({ page: '2', pageSize: '10' } as unknown as Paginator)
		expect(result).toEqual({ page: 2, pageSize: 10 })
	})

	it('aceita ausencia dos dois — ambos opcionais (defaults ficam no resolvePaginator)', async() => {
		await expect(validator.validate({})).resolves.toEqual({})
	})

	it('rejeita page < 1', async() => {
		await expect(validator.validate({ page: 0 })).rejects.toBeInstanceOf(BadRequestException)
	})

	it('rejeita pageSize > 100', async() => {
		await expect(validator.validate({ pageSize: 101 })).rejects.toBeInstanceOf(BadRequestException)
	})

	it('remove campo fora do schema (Clean)', async() => {
		const result = await validator.validate({ page: 1, extra: 'x' } as unknown as Paginator)
		expect(result).toEqual({ page: 1 })
	})

	it('aceita orderBy + orderDirection validos', async() => {
		const result = await validator.validate({ orderBy: 'name', orderDirection: 'desc' })
		expect(result).toEqual({ orderBy: 'name', orderDirection: 'desc' })
	})

	it('rejeita orderDirection fora de asc|desc', async() => {
		await expect(validator.validate({ orderDirection: 'sideways' } as unknown as Paginator))
			.rejects.toBeInstanceOf(BadRequestException)
	})
})
