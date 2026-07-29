import { count, eq } from 'drizzle-orm'
import { inject, injectable } from 'tsyringe'
import { DatabaseClientSymbol, DrizzleBaseRepository, type IPaginated, type IPaginator, resolveOrderBy } from '@/database'
import { type Db, type IUser, users } from '@/core/database'
import type { ICreateUserParams, IUsersRepository } from '../../domain/ports/users-repository.port'

// Colunas que o cliente pode ordenar (allowlist do resolveOrderBy) — orderBy
// fora daqui cai no fallback 'createdAt'.
const SORTABLE_COLUMNS = { createdAt: users.createdAt, name: users.name, email: users.email }

// Camada de acesso a dados (*.database.ts — db-testing-skill/ADR-022).
// A query É o teste: nenhuma regra de negócio mora aqui, só leitura/escrita.
@injectable()
export class UsersDatabase extends DrizzleBaseRepository<Db> implements IUsersRepository {
	constructor(@inject(DatabaseClientSymbol) db: Db) {
		super(db)
	}

	async create(input: ICreateUserParams): Promise<IUser> {
		const [row] = await this.drizzleClient.insert(users).values(input).returning()
		if (!row) throw new Error('Insert returned no row')
		return row
	}

	async findById(id: string): Promise<IUser | null> {
		const [row] = await this.drizzleClient.select().from(users).where(eq(users.id, id))
		return row ?? null
	}

	async findByEmail(email: string): Promise<IUser | null> {
		const [row] = await this.drizzleClient.select().from(users).where(eq(users.email, email))
		return row ?? null
	}

	async deleteById(id: string): Promise<void> {
		await this.drizzleClient.delete(users).where(eq(users.id, id))
	}

	async count(): Promise<number> {
		const [row] = await this.drizzleClient.select({ value: count() }).from(users)
		return row?.value ?? 0
	}

	async listPaginated(paginator: IPaginator): Promise<IPaginated<IUser>> {
		const orderBy = resolveOrderBy(SORTABLE_COLUMNS, users.createdAt, paginator)
		return this.paginatedQuery<IUser>({
			paginator,
			rows: async(limit, offset) => {
				return this.drizzleClient
					.select()
					.from(users)
					.orderBy(orderBy)
					.limit(limit)
					.offset(offset)
			},
			count: () => this.count()
		})
	}
}
