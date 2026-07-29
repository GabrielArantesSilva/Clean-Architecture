import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// Schema centralizado (convenção Drizzle) — fonte única de verdade, nunca escrito
// à mão em teste (db-testing-skill, ADR-022).
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 255 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
