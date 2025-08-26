<script lang="ts">
	import { getQueryClient } from '$lib/queryClient'
	import { hydrate, QueryClientProvider } from '@tanstack/svelte-query'
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { browser } from '$app/environment'
	import type { LayoutData } from './$types'

	// 從 load 函數中獲取數據和子組件
	const { data, children } = $props<{ data: LayoutData; children: any }>()

	// 獲取 QueryClient 實例。
	const queryClient = getQueryClient()
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
