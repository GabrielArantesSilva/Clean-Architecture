import nextConfig from 'eslint-config-next'
import globals from 'globals'

/**
 * Flat config para apps Next.js — regras nativas do Next 16 + Prettier.
 *
 * `eslint-config-next` (v16+) já registra o plugin `@typescript-eslint` e suas
 * regras recomendadas. Por isso NÃO espalhamos o `index.js` base aqui: fazê-lo
 * registraria o mesmo plugin duas vezes e o ESLint flat config lança
 * "Cannot redefine plugin '@typescript-eslint'". Reaproveitamos apenas os
 * ignores, as regras customizadas e o desligamento de estilo do Prettier.
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.{js,mjs,cjs,ts}'
    ],
  },
  ...nextConfig,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
    }
  }
]
