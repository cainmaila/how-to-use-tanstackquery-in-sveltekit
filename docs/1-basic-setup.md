## 1. 基礎設定

### 1.1 安裝必要的套件

首先，我們需要安裝 TanStack Svelte Query 及其開發者工具：

```bash
pnpm add @tanstack/svelte-query @tanstack/svelte-query-devtools
```

### 1.2 建立 QueryClient 實例管理邏輯 (`src/lib/queryClient.ts`)

在 SvelteKit 的 SSR 環境中，管理 `QueryClient` 實例至關重要。我們需要確保在伺服器端，每個請求都擁有一個獨立的 `QueryClient` 實例，以避免資料交叉污染；而在客戶端，則使用單一的 `QueryClient` 實例。這可以透過以下方式實現：

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/svelte-query'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 0
		}
	}
})

export function getQueryClient() {
	// This ensures a new queryClient is created for each request on the server,
	// while a single queryClient is used on the browser.
	if (typeof window === 'undefined') {
		return makeQueryClient()
	} else {
		if (!window.queryClient) {
			window.queryClient = makeQueryClient()
		}
		return window.queryClient
	}
}

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000 // 1 minute
			}
		}
	})
}
```

### 1.3 在 `+layout.ts` 中脫水 (Dehydrate) QueryClient 狀態

`+layout.ts` 是 SvelteKit 的伺服器端 `load` 函數，它會在頁面渲染前執行。在這裡，我們將建立 `QueryClient` 實例，並在返回資料時將其狀態「脫水」，以便在客戶端進行「注水」。

```typescript
// src/routes/+layout.ts
import { getQueryClient } from '$lib/queryClient'
import { dehydrate, type DehydratedState } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
	const queryClient = getQueryClient()

	return {
		dehydratedState: dehydrate(queryClient)
	}
}
```

### 1.4 在 `+layout.svelte` 中注水 (Hydrate) QueryClient 並提供給應用程式

`+layout.svelte` 是應用程式的根佈局。在這裡，我們將接收從 `+layout.ts` 傳來的脫水狀態，並使用 `QueryClientProvider` 將 `QueryClient` 實例提供給整個應用程式。同時，我們也會在這裡整合開發者工具。

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import { getQueryClient } from '$lib/queryClient'
	import { hydrate, QueryClientProvider } from '@tanstack/svelte-query'
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { browser } from '$app/environment'
	import type { LayoutData } from './$types'

	const { data, children } = $props<{ data: LayoutData; children: any }>()

	const queryClient = getQueryClient()
	hydrate(queryClient, data.dehydratedState)
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
