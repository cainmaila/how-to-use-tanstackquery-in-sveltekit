import { QueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient(): QueryClient {
	if (browser) {
		if (!browserQueryClient) {
			browserQueryClient = new QueryClient()
		}
		return browserQueryClient
	} else {
		return new QueryClient()
	}
}
