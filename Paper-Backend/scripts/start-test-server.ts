import { startTestDb } from '../src/testing/test-db'

// Usado pelo E2E do front-end (db-testing-skill, C2): sobe o primitivo e só
// então o servidor, já apontando pro Postgres efêmero.
const db = await startTestDb()
process.env['DATABASE_URL'] = db.url

await import('../src/server/index')
