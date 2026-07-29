import { DocumentationMetadataKeys } from './decorator'
import { type IDocumentation } from './types'

/**
 * Decorator for adding documentation metadata to use cases
 * @param documentation - The documentation object for the use case
 */
export const Documentation = (documentation: Partial<IDocumentation>) => (target: object) => {
	return Reflect.defineMetadata(DocumentationMetadataKeys.DOCUMENTATION, documentation, target)
}