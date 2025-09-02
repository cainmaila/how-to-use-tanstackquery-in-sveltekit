/**
 * TanStack Query 配置和提供者
 *
 * 提供應用級別的查詢緩存和狀態管理，包含：
 * - 全域 QueryClient 設定
 * - 默認查詢配置
 * - 緩存策略設定
 *
 * @example
 * ```svelte
 * <QueryClientProvider>
 *   <App />
 * </QueryClientProvider>
 * ```
 */

import { browser } from '$app/environment'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/svelte-query'

/**
 * 創建 QueryClient 實例
 *
 * 配置項說明：
 * - staleTime: 資料被視為過期的時間（5分鐘）
 * - cacheTime: 資料在緩存中保留的時間（10分鐘）
 * - refetchOnWindowFocus: 視窗聚焦時是否重新取得資料
 * - retry: 失敗時的重試次數
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser, //瀏覽器
			// 資料 5 分鐘內視為新鮮，不會重新請求
			staleTime: 5 * 60 * 1000,
			// 緩存資料保留 10 分鐘
			gcTime: 10 * 60 * 1000,
			// 視窗聚焦時不自動重新請求（手動控制更新）
			refetchOnWindowFocus: false,
			// 失敗時重試 2 次
			retry: 2,
			// 重試延遲，指數退避
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
		},
		mutations: {
			// 變更失敗時重試 1 次
			retry: 1
		}
	}
})

export const persister = createAsyncStoragePersister({
	storage: browser ? window.localStorage : null
})

export { QueryClientProvider, dehydrate, hydrate } from '@tanstack/svelte-query'
export { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client'
