import type { IPaginated, IPaginator } from '@/database'
import type { IUser } from '@/core/database'

export type ICreateUserParams = {
	readonly email: string
	readonly name: string
}

// Porta do repository (domain/ports) — implementação concreta fica em
// infrastructure/database/users.database.ts. Use cases (app/) dependem só disto.
export interface IUsersRepository {
	findById(id: string): Promise<IUser | null>
	findByEmail(email: string): Promise<IUser | null>
	create(data: ICreateUserParams): Promise<IUser>
	deleteById(id: string): Promise<void>
	count(): Promise<number>
	listPaginated(paginator: IPaginator): Promise<IPaginated<IUser>>
}

// Token de injeção (tsyringe) — a interface e o Symbol moram juntos no módulo do
// bounded context (boundaries.md); o bootstrap liga o Symbol à impl Drizzle.
export const UsersRepositorySymbol = Symbol('IUsersRepository')
