## 4. 開發者工具

TanStack Query 提供了強大的開發者工具，可以幫助我們監控和除錯查詢的狀態。

### 4.1 整合 Svelte Query Devtools

我們已經在 `src/routes/+layout.svelte` 中整合了開發者工具。它會自動在瀏覽器環境下顯示。

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { getQueryClient } from '$lib/queryClient';
	import { hydrate, QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { browser } from '$app/environment';
	import type { LayoutData } = './$types';

	const { data, children } = $props<{ data: LayoutData; children: any }>();

	const queryClient = getQueryClient();
	hydrate(queryClient, data.dehydratedState);

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	{@render children?.()}

	{#if browser}
		<SvelteQueryDevtools />
	{/if}
</QueryClientProvider>
```

當您在開發模式下運行應用程式時，應該會在瀏覽器視窗的右下角看到一個 TanStack Query 的圖標。點擊它可以打開開發者工具面板，查看所有查詢的狀態、快取內容、變更歷史等資訊。
