import type { IRoute } from '@/http'
import { CreateUserUseCase } from './app/create-user.use-case'
import { GetUserByIdUseCase } from './app/get-user-by-id.use-case'
import { ListUsersUseCase } from './app/list-users.use-case'

// Rotas do bounded context de usuários como dado (ADR-024, shape tecnoflow) —
// o grupo "/users" é aplicado no registerRoutes. Controller fino: quem valida
// é o use case (@ValidateWith), quem responde é o applyUseCase. Rota sem
// auth_method é pública. Uma rota nova é uma linha.
export const usersRoutes: readonly IRoute[] = [
	{ method: 'post', path: '', use_case_class: CreateUserUseCase },
	{ method: 'get', path: '', use_case_class: ListUsersUseCase, auth_method: 'jwt' },
	{ method: 'get', path: '/me', use_case_class: GetUserByIdUseCase, auth_method: 'jwt' }
]
