import { defineConfig } from 'tsup'

// Build via tsup/esbuild (ADR-026): resolve os aliases @/* e os imports sem
// extensão que o tsc puro não resolveria em Node ESM. Deps de node_modules
// ficam external (não entram no bundle). A entry nomeada preserva o caminho
// dist/server/index.js que o script `start` espera.
export default defineConfig({
	entry: { 'server/index': 'src/server/index.ts' },
	format: ['esm'],
	target: 'node20',
	clean: true,
	sourcemap: true
})
