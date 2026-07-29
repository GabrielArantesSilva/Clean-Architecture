import { Type } from 'typebox'
import { createSchema } from '@/use-case'

// Schema-fonte nomeado ($id 'entities.User'). Validators reusam por composição
// (Type.Pick) ou por Type.Ref(UserSchema.$id) declarando-o em `references`.
export const UserSchema = createSchema(Type.Object({
	id: Type.String(),
	email: Type.String({ pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' }),
	name: Type.String({ minLength: 2 }),
	createdAt: Type.String({ format: 'date-time' }),
}), 'entities.User')
