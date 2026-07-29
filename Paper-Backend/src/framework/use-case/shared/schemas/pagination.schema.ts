import { type TSchema, Type } from 'typebox'
import { createSchema } from './create-schema'

// Schema de paginação reutilizável pelos list use cases. Sem `default`: os
// defaults moram no resolvePaginator (kit database), aqui só validamos limites.
export const PaginatorSchema = Type.Object({
	page: Type.Optional(Type.Integer({ minimum: 1 })),
	pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
	orderBy: Type.Optional(Type.String({ minLength: 1 })),
	orderDirection: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')]))
})

// Metadados de paginação na resposta — schema nomeado, componente OpenAPI reusado
// por todo list endpoint.
export const PaginationSchema = createSchema(Type.Object({
	page: Type.Integer(),
	pageSize: Type.Integer(),
	totalCount: Type.Integer(),
	totalPages: Type.Integer()
}), 'objects.Pagination')

// Resposta paginada reutilizável: { data: item[], pagination }. Múltiplos list
// use cases compõem isto no @Documentation.response.
export function paginated<T extends TSchema>(item: T) {
	return Type.Object({
		data: Type.Array(item),
		pagination: Type.Ref(PaginationSchema.$id)
	})
}
