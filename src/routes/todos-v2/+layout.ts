import { getQueryClient } from '$lib/queryClient'
import { dehydrate } from '@tanstack/svelte-query'
import { fetchTodos } from '$lib/stores/todoStore.svelte'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
	// 獲取 QueryClient 實例。在伺服器端，這會為每個請求創建一個新的實例。
	// 在客戶端，它會返回一個單例實例。
	const queryClient = getQueryClient()

	// 在伺服器端預先載入 todos 資料
	await queryClient.prefetchQuery({
		queryKey: ['todos'],
		queryFn: fetchTodos
	})

	return {
		// 將 QueryClient 的狀態脫水 (dehydrate)，以便在客戶端進行注水 (hydrate)。
		// 這對於伺服器端渲染 (SSR) 至關重要，確保資料在伺服器和客戶端之間無縫傳遞。
		dehydratedState: dehydrate(queryClient)
	}
}
