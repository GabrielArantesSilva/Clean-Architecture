import { type KeyGenerator } from "axios-cache-interceptor"
import { hash } from 'object-code'

export const generateKey: KeyGenerator = ({ id, baseURL, url, method, params, data }) => {
	const SLASHES_REGEX = /^\/|\/$/g

	if (baseURL !== undefined) {
		baseURL = baseURL.replace(SLASHES_REGEX, '')
	} else {
	  baseURL = ''
	}

	if (url !== undefined) {
	  url = url.replace(SLASHES_REGEX, '')
	} else {
	  url = ''
	}

	const key = hash({
	  url: baseURL + (baseURL && url ? '/' : '') + url,
	  params,
	  method,
	  data
	})

	return `${id || ''}${key}`
}
