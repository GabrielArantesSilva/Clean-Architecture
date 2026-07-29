import type { IUser } from '@/core/database'

// Factories de teste (qa-skill): defaults sensatos, sobrescreva só o que o
// cenário exige. Data fixa (epoch) para o teste ser determinístico.
export function buildUser(overrides: Partial<IUser> = {}): IUser {
	return {
		id: 'usr_0000000001',
		email: 'ana@example.com',
		name: 'Ana',
		createdAt: new Date(0),
		...overrides
	}
}
