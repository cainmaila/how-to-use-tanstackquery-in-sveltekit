// 匯入 getQueryClient，這是一個輔助函數，用於在伺服器端為每個請求創建新的 QueryClient 實例，
// 或在客戶端返回單例的 QueryClient。這確保了請求之間的資料隔離。
import { getQueryClient } from '$lib/queryClient'
// 匯入 dehydrate，這是 TanStack Query 的一個關鍵功能，用於將查詢快取序列化（脫水），
// 以便可以將其從伺服器傳遞到客戶端。
import { dehydrate } from '@tanstack/svelte-query'
// 匯入我們定義的 API 請求函數。
import { fetchTodos } from '$lib/sdk'
// 匯入 SvelteKit 的 LayoutLoad 型別，為我們的 load 函數提供型別安全。
import type { LayoutLoad } from './$types'

// SvelteKit 的 load 函數，它會在伺服器端（首次訪問時）或客戶端（後續導航時）執行。
// 我們將其定義為 async 函數，因為我們需要在其中執行非同步操作。
export const load: LayoutLoad = async () => {
	// 獲取 QueryClient 的實例。
	const queryClient = getQueryClient()

	// 使用 prefetchQuery 在伺服器端預先獲取 'todos' 的資料。
	// 這意味著在頁面渲染之前，資料就已經被請求並放入了查詢快取中。
	// 這對於 SEO 和改善首屏載入時間至關重要。
	await queryClient.prefetchQuery({
		// queryKey 是此查詢的唯一標識符。客戶端的 useQuery 將使用相同的 key 來從快取中讀取資料。
		queryKey: ['todos'],
		// queryFn 是執行實際資料獲取的函數。
		queryFn: fetchTodos
	})

	// load 函數返回一個物件，其內容將作為 `data` prop 傳遞給對應的 +layout.svelte 和 +page.svelte 元件。
	return {
		// 在這裡，我們呼叫 dehydrate(queryClient) 來獲取快取的序列化版本。
		// SvelteKit 會自動將這個 dehydratedState 物件 JSON 化並嵌入到發送給瀏覽器的 HTML 中。
		// 這樣，客戶端就能夠「注水」（hydrate）並恢復伺服器端的快取狀態。
		dehydratedState: dehydrate(queryClient)
	}
}
