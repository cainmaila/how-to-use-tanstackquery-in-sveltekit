## 3. 資料變更 (Mutations)

TanStack Query 不僅擅長資料查詢，也提供了強大的工具來處理資料的變更 (新增、修改、刪除)。我們將使用 `createMutation` 來實現新增待辦事項的功能。

### 3.1 在 `+page.svelte` 中使用 `createMutation`

修改 `src/routes/+page.svelte`，加入 `createMutation` 的邏輯：

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
		enabled: browser
	})

	const mutation = createMutation({
		mutationFn: (newTodo: { text: string }) =>
			fetch('/api/todos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newTodo)
			}),
		onSuccess: () => {
			// 當 mutation 成功時，廢止 'todos' 查詢，觸發重新獲取最新資料
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	let newTodoText = $state('')

	function addTodo(event: SubmitEvent) {
		event.preventDefault() // 阻止表單的默認提交行為
		if (!newTodoText.trim()) return // 如果輸入為空，則不執行任何操作
		$mutation.mutate({ text: newTodoText }) // 觸發 mutation，將新的待辦事項發送到伺服器
		newTodoText = '' // 清空輸入框
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
	<!-- 提交按鈕，當 mutation 正在進行時禁用 -->
	<button type="submit" disabled={$mutation.isPending}>
		{#if $mutation.isPending}
			新增中...
		{:else}
			新增
		{/if}
	</button>
</form>
```
