import { type TSchema } from 'typebox'

// Nomeia um schema com $id. Sem registro global: quem referencia por
// Type.Ref($id) fornece o schema nas suas `references` (ADR-0006).
export function createSchema<S extends TSchema>(schema: S, $id: string): { $id: string } & S {
	return Object.assign(schema, { $id })
}
