import { describe, expect, it } from 'vitest'
import { buildPagination, DEFAULT_PAGE_SIZE, resolvePaginator } from '../pagination'

describe('resolvePaginator', () => {
	it('aplica os defaults quando o paginator vem vazio', () => {
		expect(resolvePaginator({})).toEqual({
			page: 1,
			pageSize: DEFAULT_PAGE_SIZE,
			limit: DEFAULT_PAGE_SIZE,
			offset: 0
		})
	})

	it('deriva limit/offset da pagina pedida', () => {
		expect(resolvePaginator({ page: 3, pageSize: 10 })).toEqual({
			page: 3,
			pageSize: 10,
			limit: 10,
			offset: 20
		})
	})

	it('normaliza page/pageSize invalidos (zero, negativo, fracionado) para o minimo', () => {
		expect(resolvePaginator({ page: 0, pageSize: -5 })).toMatchObject({ page: 1, pageSize: 1 })
		expect(resolvePaginator({ page: 2.7, pageSize: 10.9 })).toMatchObject({ page: 2, pageSize: 10 })
	})
})

describe('buildPagination', () => {
	it('calcula totalPages arredondando para cima', () => {
		expect(buildPagination(1, 10, 15)).toEqual({ page: 1, pageSize: 10, totalCount: 15, totalPages: 2 })
	})

	it('devolve zero paginas quando nao ha registros', () => {
		expect(buildPagination(1, 10, 0)).toEqual({ page: 1, pageSize: 10, totalCount: 0, totalPages: 0 })
	})
})
