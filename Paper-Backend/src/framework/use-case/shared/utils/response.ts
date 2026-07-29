export enum ProcessOptions {
	SUCCESS = 'success',
	FAILED = 'failed'
}

export interface ISuccessResponse<T> {
	body: T
	process: ProcessOptions.SUCCESS
	status_code: number
}

export interface IFailedResponse {
	body: string
	process: ProcessOptions.FAILED
	status_code: number
}

export type IResponse<T> = ISuccessResponse<T> | IFailedResponse

export class SuccessResponse<T> {
	process: ProcessOptions.SUCCESS = ProcessOptions.SUCCESS
	status_code: number = 200
	body: T

	constructor(data: T) {
		this.body = data
	}
}