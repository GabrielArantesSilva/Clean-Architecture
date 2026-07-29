// Barrel do kit database (framework) — só o genérico: factory paramétrica,
// contexto de transação, base repository e paginação. O schema, as entities e
// o alias `Db` do app moram em core/database (ADR-025).
export * from './client'
export * from './pagination'
export * from './repository'
