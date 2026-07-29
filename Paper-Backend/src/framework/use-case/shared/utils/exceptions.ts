import { type IFailedResponse, ProcessOptions } from './response'

export abstract class HttpException extends Error {
	process: ProcessOptions.FAILED = ProcessOptions.FAILED
	status_code: number
	body: string

	constructor(response: Pick<IFailedResponse, 'status_code' | 'body'>) {
		super(response.body)
		this.status_code = response.status_code
		this.body = response.body
	}
}

export class UnauthorizedException extends HttpException {
	constructor(message: string = 'Invalid credentials') {
		super({ status_code: 401, body: message })
	}
}

export class BadRequestException extends HttpException {
	constructor(message: string) {
		super({ status_code: 400, body: message })
	}
}

export class ForbiddenException extends HttpException {
	constructor() {
		super({ body: 'Access to this resource is blocked', status_code: 403 })
	}
}

export class NotFoundException extends HttpException {
	constructor(message: string) {
		super({ body: message, status_code: 404 })
	}
}

export class ConflictException extends HttpException {
	constructor(message: string) {
		super({ body: message, status_code: 409 })
	}
}

export class FailedDependencyException extends HttpException {
	constructor(message: string) {
		super({ body: message, status_code: 424 })
	}
}

export class RateLimitException extends HttpException {
	constructor(message: string) {
		super({ body: message, status_code: 429 })
	}
}

export class ServerErrorException extends HttpException {
	constructor(message: string) {
		super({ body: message, status_code: 500 })
	}
}

export const isHttpException = (arg: unknown): arg is HttpException => {
	return typeof arg === 'object' && arg != null &&
		'process' in arg &&
		'body' in arg &&
		'status_code' in arg
}