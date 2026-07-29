// Barrel do kit http (framework) — routing declarativo + adapter do envelope.
// O app (server/http) compõe: cria o Fastify, registra plugins e chama
// registerRoutes; o error handler e o middleware de auth são do app.
export * from './apply-use-case'
export * from './routes'
export * from './types'
