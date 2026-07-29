import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { Type } from 'typebox'
import { BadRequestException, BaseValidator, Documentation, type IUseCase, UseCaseFactory } from '@/use-case'
import { UserSchema } from '@/modules/users/domain/schemas/user.schema'

// T fornecido a parte: Static<Type.Ref> e unknown, entao nao deriva do schema (ADR-0006/0007).
type UserInput = { id: string, email: string, name: string, createdAt: string }

const userRef = Type.Ref('entities.User')

class RefValidator extends BaseValidator<UserInput, typeof userRef> {
	protected schema = userRef
	// declara o schema referenciado — nao depende de registro global
	protected override references = [UserSchema]
}

@Documentation({ summary: 'demo', response: Type.Ref('entities.User') })
class DemoUseCase implements IUseCase<UserInput, unknown> {
	async execute(): Promise<unknown> {
		return null
	}
}

describe('schema nomeado + Type.Ref por referencias explicitas', () => {
	it('UserSchema tem $id lido direto do objeto (sem registro global)', () => {
		expect((UserSchema as { $id?: string }).$id).toBe('entities.User')
	})

	it('validator resolve Type.Ref via `references` e valida contra o schema', async() => {
		const validator = new RefValidator()

		const createdAt = new Date().toISOString()
		await expect(
			validator.validate({
				id: '1',
				email: 'a@b.co',
				name: 'Ana',
				createdAt
			})).resolves.toEqual({
				id: '1',
				email: 'a@b.co',
				name: 'Ana',
				createdAt
			})
		await expect(validator.validate({ email: 'x', name: 'Ana' } as UserInput)).rejects.toBeInstanceOf(BadRequestException)
	})

	it('@Documentation aceita response com Type.Ref($id) — metadado p/ OpenAPI', () => {
		const wrapped = UseCaseFactory.create(new DemoUseCase())

		expect(wrapped.documentation?.response).toEqual({ $ref: 'entities.User' })
	})
})
