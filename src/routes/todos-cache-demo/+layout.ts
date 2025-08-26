// 匯入 getQueryClient，這是一個輔助函數，用於在伺服器端為每個請求創建新的 QueryClient 實例，
// 或在客戶端返回單例的 QueryClient。這確保了請求之間的資料隔離。
import { getQueryClient } from '$lib/queryClient'
// 匯入 dehydrate，這是 TanStack Query 的一個關鍵功能，用於將查詢快取序列化（脫水），
// 以便可以將其從伺服器傳遞到客戶端。
import { dehydrate } from '@tanstack/svelte-query'
// 匯入 SvelteKit 的 LayoutLoad 型別，為我們的 load 函數提供型別安全。
import type { LayoutLoad } from './$types'

// SvelteKit 的 load 函數，它會在伺服器端（首次訪問時）或客戶端（後續導航時）執行。
export const load: LayoutLoad = async ({ fetch }) => {
	const queryClient = getQueryClient()

	// 預先獲取 'todos' 在 status 為 'all' 時的資料，以匹配頁面的初始狀態。
	await queryClient.prefetchQuery({
		// queryKey 必須與頁面元件中的初始 queryKey 完全匹配。
		queryKey: ['todos', 'all'],
		queryFn: async () => {
			// 請求 API 時也需附帶對應的查詢參數。
			const response = await fetch('/api/todos?status=all')
			if (!response.ok) {
				throw new Error('Failed to fetch todos')
			}
			return response.json()
		}
	})

	// 返回脫水後的快取狀態，SvelteKit 會將其傳遞給客戶端。
	return {
		dehydratedState: dehydrate(queryClient)
	}
}
