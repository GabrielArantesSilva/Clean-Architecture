// Entidade como type alias (kit database) — sem classe, sem mapper: a coluna
// do schema já é a forma final. Quando schema e domínio divergirem, vira mapper.
export type IUser = {
	readonly id: string
	email: string
	name: string
	readonly createdAt: Date
}
