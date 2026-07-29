// Response-contract adapters. Each contract is self-contained (its interceptor +
// types live under one folder). `use-case-core` is the default, applied by
// `createApiClient` unless `skipApiContract: true`. To adopt a different contract,
// register its interceptor in `client.ts` (this is a boilerplate — contracts
// are chosen in code, not passed in at runtime).
export {
  registerUseCaseCoreInterceptor,
  isApiResponse,
  isFailedResponse,
} from './use-case-core'
export type { ApiResponse, ISuccessResponse, IFailedResponse } from './use-case-core'
