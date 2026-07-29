import { lintConfig } from '@specter-labs/eslint-config'

export default [
	...lintConfig(),
	{
		rules: {
			'typescript/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports'
				}
			],
			'no-console': [
				'warn',
				{
					allow: ['warn', 'error', 'info']
				}
			]
		}
	}
]
