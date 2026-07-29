import { asc, type Column, desc, type SQL } from 'drizzle-orm'

// Primitivo de paginação do kit database (ADR-023). Tipos + cálculo de
// limit/offset genéricos; a query específica (colunas, filtros, order) é do
// repository do bounded context — aqui só mora o que é comum a toda paginação.

export const DEFAULT_PAGE_SIZE = 25

export type OrderDirection = 'asc' | 'desc'

// O que chega do cliente (via query string, já coagida a number pelo
// BaseValidator). Opcional em tudo — o resolvePaginator aplica os defaults.
export interface IPaginator {
	readonly page?: number
	readonly pageSize?: number
	readonly orderBy?: string
	readonly orderDirection?: OrderDirection
}

// O que volta no envelope junto dos dados.
export interface IPagination {
	readonly page: number
	readonly pageSize: number
	readonly totalCount: number
	readonly totalPages: number
}

export interface IPaginated<T> {
	readonly data: readonly T[]
	readonly pagination: IPagination
}

export interface IResolvedPaginator {
	readonly page: number
	readonly pageSize: number
	readonly limit: number
	readonly offset: number
}

// Normaliza page/pageSize (>= 1, inteiros) e deriva limit/offset. Ponto único
// onde a matemática de paginação mora — nenhum repository recalcula offset.
export function resolvePaginator(paginator: IPaginator): IResolvedPaginator {
	const page = Math.max(1, Math.trunc(paginator.page ?? 1))
	const pageSize = Math.max(1, Math.trunc(paginator.pageSize ?? DEFAULT_PAGE_SIZE))
	return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize }
}

export function buildPagination(page: number, pageSize: number, totalCount: number): IPagination {
	return { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) }
}

// orderBy é input externo: só colunas do allowlist `sortable` ordenam (fora
// dele usa a coluna `fallback` — nunca vai cru pra query, evita SQLi). Direction: asc.
export function resolveOrderBy(
	sortable: Record<string, Column>,
	fallback: Column,
	paginator: Pick<IPaginator, 'orderBy' | 'orderDirection'>
): SQL {
	const selected = paginator.orderBy !== undefined ? sortable[paginator.orderBy] : undefined
	const column = selected ?? fallback
	return paginator.orderDirection === 'desc' ? desc(column) : asc(column)
}
