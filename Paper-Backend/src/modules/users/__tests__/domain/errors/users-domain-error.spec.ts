import { describe, expect, it } from 'vitest'
import { ConflictException, NotFoundException } from '@/use-case'
import { UsersDomainError, UsersDomainErrorType } from '@/modules/users/domain/errors/users-domain-error'

describe('UsersDomainError', () => {
	it('userNotFound() lança NotFoundException (404) com o código do enum no body', () => {
		const error = UsersDomainError.userNotFound()

		expect(error).toBeInstanceOf(NotFoundException)
		expect(error.status_code).toBe(404)
		expect(error.body).toBe(UsersDomainErrorType.USER_NOT_FOUND)
	})

	it('emailAlreadyInUse() lança ConflictException (409) com o código do enum no body', () => {
		const error = UsersDomainError.emailAlreadyInUse()

		expect(error).toBeInstanceOf(ConflictException)
		expect(error.status_code).toBe(409)
		expect(error.body).toBe(UsersDomainErrorType.EMAIL_ALREADY_IN_USE)
	})
})
