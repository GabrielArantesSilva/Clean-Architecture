import { startTestDb } from './test-db'

// Uso avulso (db-testing-skill): `pnpm db:test:up` sobe o Postgres efêmero e
// imprime a DATABASE_URL pra inspecionar com um client manualmente.
const db = await startTestDb()
// eslint-disable-next-line no-console
console.log(`DATABASE_URL=${db.url}`)
// eslint-disable-next-line no-console
console.log('Ctrl+C to tear down the container.')
process.on('SIGINT', async() => {
	await db.stop()
	process.exit(0)
})
