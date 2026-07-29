export interface IValidator<T> {
	validate(data: T): Promise<T>
	/**
     * Optionally performs additional processing on the data after initial validation.
     *
     * @param data - The data to process
     * @returns A Promise resolving to the processed data
     */
	include?(data: T): Promise<T>
}
