import { ConflictException, NotFoundException } from '@/use-case'

// Catálogo de erros de negócio do módulo. O código do enum vira o `body` do
// envelope; kami lança HttpException (não payload { message } do obras — ADR-0004).
export enum UsersDomainErrorType {
	USER_NOT_FOUND = 'USER_NOT_FOUND',
	EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE'
}

export class UsersDomainError {
	static userNotFound(): NotFoundException {
		return new NotFoundException(UsersDomainErrorType.USER_NOT_FOUND)
	}

	static emailAlreadyInUse(): ConflictException {
		return new ConflictException(UsersDomainErrorType.EMAIL_ALREADY_IN_USE)
	}
}
