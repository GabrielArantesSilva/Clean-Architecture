import { buildMemoryStorage, type MemoryStorage } from 'axios-cache-interceptor'

export type { AxiosStorage as CacheStorage } from 'axios-cache-interceptor'

/**
 * Builds an in-memory cache storage for the HTTP client (axios-cache-interceptor).
 *
 * Pass the returned instance as the factory/client `storage` so every client minted
 * from it shares ONE cache. Intended for the browser, where all clients belong to the
 * same authenticated user. Do NOT share a single storage across server-side clients:
 * they carry per-user cookies, and a shared store would leak cached responses between
 * users. Omit `storage` and each client builds its own isolated in-memory store.
 *
 * Arguments are forwarded to `buildMemoryStorage`
 * (`cloneData`, `cleanupInterval`, `maxEntries`, `maxStaleAge`).
 */
export function createMemoryCacheStorage(
	...args: Parameters<typeof buildMemoryStorage>
): MemoryStorage {
	const storage = buildMemoryStorage(...args)
	
	storage.remove = async (pattern: string) => {
		const regex = new RegExp(pattern)

		for (const [key,] of storage.data.entries()) {
			if (regex.test(key)) {
				storage.data.delete(key)
			}
		}
	}

	return storage
}
