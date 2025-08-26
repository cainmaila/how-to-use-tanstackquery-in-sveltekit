<script lang="ts">
	import { hydrate, QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { browser } from '$app/environment'
	import type { LayoutData } from './$types'

	// 從 load 函數中獲取數據和子組件
	const { data, children } = $props<{ data: LayoutData; children: any }>()

	// 獲取 QueryClient 實例。
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// 預設的查詢選項，例如：
				staleTime: 1000 * 60 * 5, // 資料在 5 分鐘內被視為新鮮
				gcTime: 1000 * 60 * 60 * 24, // 資料在 24 小時後被垃圾回收
				refetchOnWindowFocus: false // 視窗重新聚焦時不自動重新整理
			}
		}
	})
	// 使用從伺服器傳來的脫水狀態 (dehydratedState) 注水 (hydrate) QueryClient。
	hydrate(queryClient, data.dehydratedState)
</script>

<!-- 使用 QueryClientProvider 包裹應用程式，將 queryClient 提供給所有子組件。 -->
<QueryClientProvider client={queryClient}>
	<!-- 渲染子組件，即當前路由的頁面內容 -->
	{@render children?.()}

	<!-- 僅在瀏覽器環境下顯示 Svelte Query 開發者工具，方便調試。 -->
	{#if browser}
		<SvelteQueryDevtools />
	{/if}
</QueryClientProvider>
