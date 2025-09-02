<script lang="ts">
	import { PersistQueryClientProvider } from '$lib/stores/queryClient'
	import { QueryClient } from '@tanstack/svelte-query'
	import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
	import { browser } from '$app/environment'
	import localForage from 'localforage'

	let data = $props()
	//使用 localForage 作為 persister 的儲存機制，預設install  IndexedDB
	const localforage = localForage.createInstance({
		name: 'caintest' //indexedDB 名稱
	})
	//建立一個 persister 實例
	const persisterIndexDb = createAsyncStoragePersister({
		storage: browser ? localforage : null
	})
	//一定要建立一個新的 QueryClient 實例，否則會跟上一層衝突
	const queryClient = new QueryClient({
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
</script>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister: persisterIndexDb }}>
	{@render data.children()}
</PersistQueryClientProvider>
