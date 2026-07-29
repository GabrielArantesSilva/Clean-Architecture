import 'reflect-metadata'

import { ValidatorMetadataKeys, type ValidatorMetadataType } from '../../modules/validator/decorator'
import { DocumentationMetadataKeys, type DocumentationMetadataType } from '../../modules/documentation/decorator'

export const MetadataKeys = {
	...ValidatorMetadataKeys,
	...DocumentationMetadataKeys
} as const

type MetadataKeys = typeof MetadataKeys[keyof typeof MetadataKeys]

type MetadataType<T> = DocumentationMetadataType & ValidatorMetadataType<T>

export const getMetadata = <K extends MetadataKeys>(
	key: K
): <T>(target: object) => MetadataType<T>[K] | undefined => {
	return (target: object) => Reflect.getMetadata(key, target)
}