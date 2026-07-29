import { type IDocumentation } from './types'

export const DocumentationMetadataKeys = {
	DOCUMENTATION: 'documentation'
} as const

export type DocumentationMetadataType = {
	[DocumentationMetadataKeys.DOCUMENTATION]: IDocumentation
}