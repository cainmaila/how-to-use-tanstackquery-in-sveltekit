# TanStack Query in SvelteKit: 完整教學

本教學將帶領您逐步了解如何在 SvelteKit 專案中整合並有效使用 TanStack Query，涵蓋資料獲取、資料變更、伺服器端渲染 (SSR) 以及開發者工具的應用。

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

## 2. 基本查詢 (`+page.svelte`)

### 2.1 建立 API 路由 (`src/routes/api/todos/+server.ts`)

首先，我們需要一個簡單的後端 API 來提供待辦事項資料。在 `src/routes/api/todos/+server.ts` 中建立以下內容：

```typescript
// src/routes/api/todos/+server.ts
import { json } from '@sveltejs/kit'

let todos: { id: number; text: string }[] = [
	{ id: 1, text: '學習 TanStack Query' },
	{ id: 2, text: '完成 SvelteKit 專案' },
	{ id: 3, text: '撰寫教學文件' }
]

export function GET() {
	return json(todos)
}

export async function POST(request: Request) {
	const { text } = await request.json()
	const newTodo = { id: todos.length + 1, text }
	todos.push(newTodo)
	return json(newTodo, { status: 201 })
}
```

### 2.2 在 `+page.ts` 中預先載入資料 (Prefetching)

為了實現更好的使用者體驗和 SEO，我們可以在伺服器端預先載入資料。在 `src/routes/+page.ts` 中，我們將使用 `queryClient.prefetchQuery` 來實現這一點：

```typescript
// src/routes/+page.ts
import { getQueryClient } from '$lib/queryClient'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
	const queryClient = getQueryClient()

	await queryClient.prefetchQuery({
		queryKey: ['todos'],
		queryFn: async () => {
			const res = await fetch('http://localhost:5173/api/todos') // 注意：在伺服器端需要使用完整的 URL
			return res.json()
		}
	})
}
```

### 2.3 在 `+page.svelte` 中顯示資料

現在，我們可以在 `src/routes/+page.svelte` 中使用 `createQuery` 來獲取並顯示這些待辦事項。由於我們已經在 `+layout.svelte` 中設定了 `QueryClientProvider`，所以這裡可以直接使用 `createQuery`，無需手動傳遞 `queryClient`。

````svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { browser } from '$app/environment';

	const queryClient = useQueryClient();

	const query = createQuery(
		{
			queryKey: ['todos'],
			queryFn: async () => {
				const res = await fetch('/api/todos');
				return res.json();
			},
			enabled: browser, // 確保只在瀏覽器端啟用自動重新獲取
		}
	);

	// ... (mutation 相關程式碼將在下一節介紹)

	let newTodoText = $state('');

	function addTodo(event: SubmitEvent) {
		event.preventDefault();
		if (!newTodoText.trim()) return;
		// $mutation.mutate({ text: newTodoText }); // mutation 相關程式碼將在下一節介紹
		newTodoText = '';
	}
</script>

<h1>Todos</h1>

{#if $query.isLoading}
	<p>載入中...</p>
{:else if $query.isError}
	<p>錯誤: {$query.error.message}</p>
{:else}
	<ul>
		{#each $query.data as todo}
			<li>{todo.text}</li>
		{/each}
	</ul>
{/if}

<form onsubmit={addTodo}>
	<input type="text" bind:value={newTodoText} placeholder="新增待辦事項..." />
	<button type="submit" disabled={false}>
		新增
	</button>
</form>

### 2.4 查詢狀態的差異 (`isLoading`, `isFetching`, `isPending`)

在 TanStack Query 中，理解不同的查詢狀態對於構建響應式 UI 至關重要。以下是 `$query` 物件中幾個常見狀態的差異：

*   **`$query.isLoading`**：
    *   **定義**：當查詢正在獲取資料且目前**沒有任何資料**時為 `true`。這通常發生在組件首次載入時，或者當查詢被重置且沒有快取資料時。
    *   **用途**：主要用於顯示初始的「載入中...」狀態，例如全螢幕載入指示器或骨架屏。
    *   **與 `isPending` 的關係**：在 TanStack Query v5 中，`isLoading` 的行為與舊版中的 `isPending` 相同。`isPending` 屬性仍然存在，但 `isLoading` 是推薦用於此場景的屬性。

*   **`$query.isFetching`**：
    *   **定義**：當查詢正在獲取資料時為 `true`，**無論是否有現有資料**。這包括首次獲取、背景重新獲取（例如，由於 `staleTime` 過期、手動調用 `invalidateQueries` 或 `refetch`）。
    *   **用途**：用於顯示背景更新的指示器，例如在資料已經顯示在畫面上時，顯示一個小的「重新整理中...」或「更新中...」圖標。
    *   **與 `isLoading` 的區別**：當 `isLoading` 為 `false` 但 `isFetching` 為 `true` 時，表示資料已經存在並顯示在畫面上，但正在進行背景更新。

*   **`$query.isPending`**：
    *   **定義**：當查詢正在獲取資料且目前**沒有任何資料**時為 `true`。
    *   **用途**：與 `isLoading` 相同。
    *   **注意**：在 TanStack Query v5 中，`isLoading` 是推薦用於此狀態的屬性。`isPending` 主要用於向後兼容性。在新的專案中，建議優先使用 `isLoading`。

**總結實用建議**：

*   **初始載入**：使用 `$query.isLoading` 來判斷是否顯示初始載入狀態（例如，當頁面剛載入且沒有任何資料時）。
*   **背景更新**：使用 `$query.isFetching && !$query.isLoading` 來判斷是否顯示背景更新狀態（例如，當資料已經顯示在畫面上，但正在後台重新獲取時）。

透過區分這些狀態，您可以為使用者提供更精確和流暢的載入體驗。

## 3. 資料變更 (Mutations)

TanStack Query 不僅擅長資料查詢，也提供了強大的工具來處理資料的變更 (新增、修改、刪除)。我們將使用 `createMutation` 來實現新增待辦事項的功能。

### 3.1 在 `+page.svelte` 中使用 `createMutation`

修改 `src/routes/+page.svelte`，加入 `createMutation` 的邏輯：

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { browser } from '$app/environment';

	const queryClient = useQueryClient();

	const query = createQuery(
		{
			queryKey: ['todos'],
			queryFn: async () => {
				const res = await fetch('/api/todos');
				return res.json();
			},
			enabled: browser,
		}
	);

	const mutation = createMutation(
		{
			mutationFn: (newTodo: { text: string }) =>
				fetch('/api/todos', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(newTodo),
				}),
			onSuccess: () => {
				// 當 mutation 成功時，廢止 'todos' 查詢，觸發重新獲取最新資料
				queryClient.invalidateQueries({ queryKey: ['todos'] });
			},
		}
	);

	let newTodoText = $state('');

	function addTodo(event: SubmitEvent) {
		event.preventDefault(); // 阻止表單的默認提交行為
		if (!newTodoText.trim()) return; // 如果輸入為空，則不執行任何操作
		$mutation.mutate({ text: newTodoText }); // 觸發 mutation，將新的待辦事項發送到伺服器
		newTodoText = ''; // 清空輸入框
	}
</script>

<h1>Todos</h1>

{#if $query.isLoading}
	<p>載入中...</p>
{:else if $query.isError}
	<p>錯誤: {$query.error.message}</p>
{:else}
	<ul>
		{#each $query.data as todo}
			<li>{todo.text}</li>
		{/each}
	</ul>
{/if}

<form onsubmit={addTodo}>
	<input type="text" bind:value={newTodoText} placeholder="新增待辦事項..." />
	<button type="submit" disabled={$mutation.isPending}>
		{#if $mutation.isPending}
			新增中...
		{:else}
			新增
		{/if}
	</button>
</form>

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
	import type { LayoutData } from './$types';

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
````

當您在開發模式下運行應用程式時，應該會在瀏覽器視窗的右下角看到一個 TanStack Query 的圖標。點擊它可以打開開發者工具面板，查看所有查詢的狀態、快取內容、變更歷史等資訊。

## 總結

透過本教學，您應該已經掌握了在 SvelteKit 專案中整合和使用 TanStack Query 的核心概念和實踐。從基礎設定、資料查詢、資料變更到開發者工具的應用，TanStack Query 都能極大地簡化您的資料管理工作，並提升應用程式的效能和使用者體驗。
