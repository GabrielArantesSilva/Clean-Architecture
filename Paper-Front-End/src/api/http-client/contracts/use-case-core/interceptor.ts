import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

import { isApiResponse, isFailedResponse } from './types'

// Contract-specific interceptor for the "use-case-core" API envelope
// (`{ process: 'success' | 'failed', body }`). It unwraps a success envelope so
// `response.data` is the `body`, and turns a failed envelope into a rejected
// Error whose message is the `body`. Disable it with `skipApiContract: true`, or swap
// in another contract's interceptor (from `contracts/`) in `client.ts` when
// the client talks to an API with a different response shape.
export function registerUseCaseCoreInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (response.config.skipEnvelopeUnwrap) return response

      const data: unknown = response.data
      if (!isApiResponse(data)) return response

      if (data.process === 'success') {
        response.data = data.body
        return response
      }

      return Promise.reject(buildEnvelopeError(data.body, response))
    },
    (error: AxiosError) => {
      const data: unknown = error.response?.data
      if (isFailedResponse(data)) {
        return Promise.reject(buildEnvelopeError(data.body, error.response, error))
      }
      return Promise.reject(error)
    }
  )
}

function buildEnvelopeError(
  message: string,
  response: AxiosResponse | undefined,
  cause?: AxiosError,
): AxiosError {
  const err = (cause ?? new Error(message)) as AxiosError
  err.message = message
  if (response) err.response = response
  return err
}
