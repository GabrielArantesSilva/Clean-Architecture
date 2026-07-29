import { type Static, Type } from 'typebox'
import { Compile } from 'typebox/compile'

// Validação de ambiente com TypeBox nativo (Compile) — sem AJV (ADR-024).
// `Default`/`Convert` recuperam o que o Zod `.default()`/`.coerce` davam:
// aplicam os defaults e coagem PORT ("3000" -> 3000) antes de validar.
const EnvSchema = Type.Object({
	NODE_ENV: Type.Union(
		[Type.Literal('development'), Type.Literal('test'), Type.Literal('production')],
		{ default: 'development' }
	),
	PORT: Type.Integer({ minimum: 1, default: 3000 }),
	LOG_LEVEL: Type.Union(
		[Type.Literal('debug'), Type.Literal('info'), Type.Literal('warn'), Type.Literal('error')],
		{ default: 'info' }
	),
	DATABASE_URL: Type.String({ minLength: 1 }),
	SESSION_COOKIE_NAME: Type.String({ minLength: 1, default: 'session' }),
	SESSION_SECRET: Type.String({ minLength: 16 })
})

export type Env = Static<typeof EnvSchema>

function loadEnv(): Env {
	const validator = Compile(EnvSchema)
	const prepared = validator.Convert(validator.Default({ ...process.env }))

	if (validator.Check(prepared)) {
		return prepared
	}

	const issues = [...validator.Errors(prepared)]
		.map((issue) => `  - ${issue.instancePath.replace('/', '') || '(root)'}: ${issue.message}`)
		.join('\n')
	// TD-0001 (.harness/tech-debt/log.md): console.error aqui é intencional e permanente —
	// o Logger (core/logger) é escolhido com base em env.NODE_ENV, que ainda não existe
	// se chegamos neste ponto. Não há porta de log disponível antes do boot validar o env.

	console.error(`Invalid configuration — environment variables:\n${issues}`)
	process.exit(1)
}

// Falha cedo no boot (ADR-021) — qualquer outro módulo importa daqui já validado.
export const env: Env = loadEnv()
