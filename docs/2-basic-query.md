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

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { browser } from '$app/environment'

	const queryClient = useQueryClient()

	const query = createQuery({
		queryKey: ['todos'],
		queryFn: async () => {
			const res = await fetch('/api/todos')
			return res.json()
		},
		enabled: browser // 確保只在瀏覽器端啟用自動重新獲取
	})

	// ... (mutation 相關程式碼將在下一節介紹)

	let newTodoText = $state('')

	function addTodo(event: SubmitEvent) {
		event.preventDefault()
		if (!newTodoText.trim()) return
		// $mutation.mutate({ text: newTodoText }); // mutation 相關程式碼將在下一節介紹
		newTodoText = ''
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
	<button type="submit" disabled={false}> 新增 </button>
</form>

### 2.4 查詢狀態的差異 (`isLoading`, `isFetching`, `isPending`) 在 TanStack Query
中，理解不同的查詢狀態對於構建響應式 UI 至關重要。以下是 `$query` 物件中幾個常見狀態的差異： *
**`$query.isLoading`**： * **定義**：當查詢正在獲取資料且目前**沒有任何資料**時為
`true`。這通常發生在組件首次載入時，或者當查詢被重置且沒有快取資料時。 *
**用途**：主要用於顯示初始的「載入中...」狀態，例如全螢幕載入指示器或骨架屏。 * **與 `isPending`
的關係**：在 TanStack Query v5 中，`isLoading` 的行為與舊版中的 `isPending` 相同。`isPending`
屬性仍然存在，但 `isLoading` 是推薦用於此場景的屬性。 * **`$query.isFetching`**： *
**定義**：當查詢正在獲取資料時為
`true`，**無論是否有現有資料**。這包括首次獲取、背景重新獲取（例如，由於 `staleTime` 過期、手動調用
`invalidateQueries` 或 `refetch`）。 *
**用途**：用於顯示背景更新的指示器，例如在資料已經顯示在畫面上時，顯示一個小的「重新整理中...」或「更新中...」圖標。
* **與 `isLoading` 的區別**：當 `isLoading` 為 `false` 但 `isFetching` 為 `true`
時，表示資料已經存在並顯示在畫面上，但正在進行背景更新。 * **`$query.isPending`**： *
**定義**：當查詢正在獲取資料且目前**沒有任何資料**時為 `true`。 * **用途**：與 `isLoading` 相同。 *
**注意**：在 TanStack Query v5 中，`isLoading` 是推薦用於此狀態的屬性。`isPending`
主要用於向後兼容性。在新的專案中，建議優先使用 `isLoading`。 **總結實用建議**： * **初始載入**：使用
`$query.isLoading` 來判斷是否顯示初始載入狀態（例如，當頁面剛載入且沒有任何資料時）。 *
**背景更新**：使用 `$query.isFetching && !$query.isLoading`
來判斷是否顯示背景更新狀態（例如，當資料已經顯示在畫面上，但正在後台重新獲取時）。
透過區分這些狀態，您可以為使用者提供更精確和流暢的載入體驗。
```
