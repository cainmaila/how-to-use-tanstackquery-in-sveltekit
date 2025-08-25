import { getQueryClient } from '$lib/queryClient'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
	// 獲取 QueryClient 實例。在 SvelteKit 的 load 函數中，
	// 這是獲取伺服器端 QueryClient 的推薦方式。
	const queryClient = getQueryClient()

	// 使用 prefetchQuery 在伺服器端預先獲取 'todos' 資料。
	// 這有助於提升首次載入性能和 SEO，因為資料會在頁面渲染前準備好。
	await queryClient.prefetchQuery({
		// queryKey: 查詢的唯一識別符。當資料需要重新獲取或失效時，會使用此鍵。
		queryKey: ['todos'],
		// queryFn: 實際獲取資料的函數。它應該返回一個 Promise。
		queryFn: async () => {
			const res = await fetch('/api/todos')
			return res.json()
		}
	})
}
