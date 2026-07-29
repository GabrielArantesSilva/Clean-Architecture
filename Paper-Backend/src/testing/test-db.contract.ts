// Contrato ORM-agnóstico do primitivo de teste (ADR-022, db-testing-skill).
export interface TestDb<T = unknown> {
	readonly url: string
	readonly client: T
	seed(): Promise<void>
	truncate(): Promise<void>
	stop(): Promise<void>
}
