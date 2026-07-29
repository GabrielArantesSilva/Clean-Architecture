import { getDatabaseClient } from './client'
import { generateRandomId } from './helpers'
import { buildPagination, type IPaginated, type IPaginator, resolvePaginator } from './pagination'

type GenerateIdParams = {
	prefix?: string
}

// Base de repository (kit database) — repositories estendem isto e usam
// this.drizzleClient em vez do client injetado direto, pra respeitar o
// contexto de transação (withTransaction) sem precisar saber que ele existe.
// TDb é o client do APP (ex.: `Db` de core/database) — o kit fica paramétrico
// e não importa o schema de ninguém (ADR-025).
export abstract class DrizzleBaseRepository<TDb> {
	constructor(private readonly db: TDb) {}

	protected get drizzleClient(): TDb {
		return getDatabaseClient(this.db)
	}

	// Id curto prefixado por entidade (mesmo contrato do tecnoflow): o prefixo
	// identifica o dono do registro no olho (usr_a1B2c3D4e5F, ord_...). A coluna
	// precisa ser varchar/text — para id gerado pelo banco (uuid defaultRandom),
	// simplesmente não chame isto.
	protected generateId({ prefix }: GenerateIdParams = {}): string {
		const baseID = generateRandomId()
		return prefix ? `${prefix}_${baseID}` : baseID
	}

	// Paginação genérica: o repository informa COMO buscar a página (rows) e COMO
	// contar o total (count) — a query específica (colunas, filtros, order) é
	// dele; o cálculo de limit/offset e a montagem de { data, pagination } ficam
	// aqui. rows e count rodam em paralelo (Promise.all).
	protected async paginatedQuery<TRow>(input: {
		paginator: IPaginator
		rows: (limit: number, offset: number) => Promise<TRow[]>
		count: () => Promise<number>
	}): Promise<IPaginated<TRow>> {
		const { page, pageSize, limit, offset } = resolvePaginator(input.paginator)
		const [data, totalCount] = await Promise.all([input.rows(limit, offset), input.count()])
		return { data, pagination: buildPagination(page, pageSize, totalCount) }
	}
}
