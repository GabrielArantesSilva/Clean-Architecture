import { type Static, type TProperties, type TSchema } from 'typebox'
import { Compile, type Validator } from 'typebox/compile'
import { type TLocalizedValidationError } from 'typebox/error'

import { type IValidator } from './types'
import { ValidatorMetadataKeys } from './decorator'

import { BadRequestException } from '../../shared/utils/exceptions'

/**
 * Compiled-schema store.
 *
 * TypeBox's `Compile` JIT-builds a validation function, which is expensive and
 * must not run on every request. Previously (with ajv) each `validate` call
 * hashed the whole schema with `object-hash` to derive a cache key and then
 * looked it up in ajv's internal registry — hashing per request just to reuse
 * the compiled function. Here we key the cache by the schema object itself:
 * a `WeakMap` gives us O(1) reuse with no hashing, and lets the compiled
 * validator be collected once its schema is gone.
 */
const compiledSchemas = new WeakMap<TSchema, Validator>()

// Context (schemas nomeados) para o Compile resolver Type.Ref($id) — vem das
// `references` que o próprio validator declara, não de um registro global.
const buildContext = (references: readonly TSchema[]): TProperties => {
	const context: Record<string, TSchema> = {}
	for (const ref of references) {
		const $id = (ref as { $id?: string }).$id
		if ($id === undefined) {
			throw new Error('BaseValidator.references: schema sem $id nao pode ser referenciado')
		}
		context[$id] = ref
	}
	return context
}

const compile = (schema: TSchema, references: readonly TSchema[]): Validator => {
	const cached = compiledSchemas.get(schema)
	if (cached !== undefined) return cached

	const validator = Compile(buildContext(references), schema)
	compiledSchemas.set(schema, validator)
	return validator
}

const formatValidationError = (errors: TLocalizedValidationError[]): string => {
	const first = errors.at(0)
	if (first == null) {
		return 'Bad request'
	}

	const field = first.instancePath.replace('/', '')
	return `${field} ${first.message}`.trim()
}

export abstract class BaseValidator<
	T extends Static<S>,
	S extends TSchema
> implements IValidator<T> {
	protected abstract schema: S
	// Schemas que o `schema` referencia por Type.Ref($id). Vazio por padrão: só
	// validators que usam ref precisam declarar (ADR-0006).
	protected references: readonly TSchema[] = []

	async validate(data: T): Promise<T> {
		const validator = compile(this.schema, this.references)
		// Sem AJV, o pipeline nativo do TypeBox recupera o que o `coerceTypes` +
		// `useDefaults` + `removeAdditional` do AJV davam no tecnoflow: `Default`
		// aplica os `default` do schema, `Convert` coage query string -> tipo
		// ("20" -> 20, "true" -> true) e `Clean` remove campo fora do schema.
		// Só então validamos.
		const prepared = validator.Clean(validator.Convert(validator.Default(data))) as T

		if (validator.Check(prepared)) {
			return this.include ? this.include(prepared) : prepared
		}
		throw new BadRequestException(formatValidationError(validator.Errors(prepared)))
	}

	include?(data: T): Promise<T>
}

export const ValidateWith = <T>(
	validator_class: () => new () => IValidator<T>
) => (target: object) => {
	return Reflect.defineMetadata(ValidatorMetadataKeys.VALIDATE_WITH, validator_class, target)
}
