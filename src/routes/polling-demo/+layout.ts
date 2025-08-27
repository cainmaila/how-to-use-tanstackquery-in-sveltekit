// src/routes/polling-demo/+layout.ts
import { getQueryClient } from '$lib/queryClient'
import { dehydrate } from '@tanstack/svelte-query'

// 在這個範例中，我們不在伺服器端預先獲取任何資料。
// 我們只建立 QueryClient 並將其（空的）狀態脫水傳遞給客戶端。
// 輪詢的邏輯將完全在客戶端處理。
export const load = async () => {
	const queryClient = getQueryClient()

	return {
		dehydratedState: dehydrate(queryClient)
	}
}
