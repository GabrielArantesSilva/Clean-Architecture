import path from 'node:path'
import { defineConfig } from 'vitest/config'

const src = (subpath: string): string => path.resolve(import.meta.dirname, 'src', subpath)

export default defineConfig({
	// O Vitest não lê os paths do tsconfig — os aliases são duplicados aqui
	// (mesma abordagem do tecnoflow). Ordem importa: específicos antes do '@'.
	resolve: {
		alias: [
			{ find: '@/use-case', replacement: src('framework/use-case') },
			{ find: '@/database', replacement: src('framework/database') },
			{ find: '@/http', replacement: src('framework/http') },
			{ find: '@', replacement: src('.') }
		]
	},
	test: {
		environment: 'node',
		setupFiles: ['./vitest.setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html']
		}
	}
})
