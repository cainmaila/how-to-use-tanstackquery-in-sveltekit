<script lang="ts">
	// 從 @tanstack/svelte-query 匯入核心功能
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	// 匯入我們的 API 函數
	import { fetchTodos, addTodoApi, updateTodoApi, deleteTodoApi } from '$lib/sdk'

	const queryClient = useQueryClient()

	// --- 查詢 (Query) ---
	// 使用 createQuery 建立一個查詢來獲取待辦事項列表。
	// 因為我們在 +layout.ts 中使用了 prefetchQuery，
	// 所以在客戶端，這個 createQuery 會首先檢查快取中是否有 'todos' 的資料。
	// 如果有（來自伺服器端的 dehydrate），它會立即顯示這些資料，然後在背景重新獲取以確保資料是新鮮的。
	const todosQuery = createQuery<Todo[]>({
		queryKey: ['todos'],
		queryFn: fetchTodos
	})

	// --- 變異 (Mutations) ---
	// 建立一個用於新增待辦事項的變異
	const addTodoMutation = createMutation({
		mutationFn: addTodoApi,
		onSuccess: () => {
			// 當新增成功後，讓 'todos' 查詢失效，這會觸發自動重新獲取
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 建立一個用於更新待辦事項的變異
	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 建立一個用於刪除待辦事項的變異
	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// --- 元件狀態和事件處理 ---
	let newTodoText = ''

	function handleAddTodo(event: SubmitEvent) {
		event.preventDefault()
		if (!newTodoText.trim()) return
		// 呼叫變異的 mutate 函數來觸發新增操作
		$addTodoMutation.mutate(newTodoText)
		newTodoText = ''
	}

	function handleToggleTodo(todo: Todo) {
		const updatedTodo: Todo = { ...todo, completed: !todo.completed }
		$updateTodoMutation.mutate(updatedTodo)
	}

	function handleDeleteTodo(id: number) {
		$deleteTodoMutation.mutate(id)
	}
</script>

<div class="container">
	<h1>
		待辦事項列表 (v1)
		<!--
            $todosQuery.isFetching 會在背景重新獲取資料時為 true。
            $todosQuery.isLoading 僅在初次載入時為 true。
            這個組合可以讓我們在不打擾用戶的情況下，在背景顯示一個同步指示器。
        -->
		{#if $todosQuery.isFetching && !$todosQuery.isLoading}
			<span class="syncing">(同步中...)</span>
		{/if}
	</h1>

	<form on:submit={handleAddTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<!-- 根據變異的 isPending 狀態來禁用按鈕 -->
		<button type="submit" disabled={$addTodoMutation.isPending}>
			{$addTodoMutation.isPending ? '新增中...' : '新增'}
		</button>
	</form>

	<!-- 根據查詢的狀態來顯示不同的 UI -->
	{#if $todosQuery.isLoading}
		<p>載入中...</p>
	{:else if $todosQuery.error}
		<p class="error">錯誤: {$todosQuery.error.message}</p>
	{:else if !$todosQuery.data || $todosQuery.data.length === 0}
		<p>目前沒有待辦事項。</p>
	{:else}
		<ul class="todo-list">
			<!-- 迭代顯示待辦事項 -->
			{#each $todosQuery.data as todo (todo.id)}
				<li class="todo-item">
					<input
						type="checkbox"
						checked={todo.completed}
						on:change={() => handleToggleTodo(todo)}
						disabled={$updateTodoMutation.isPending}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button
						on:click={() => handleDeleteTodo(todo.id)}
						disabled={$deleteTodoMutation.isPending}
					>
						刪除
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.container {
		max-width: 600px;
		margin: 50px auto;
		padding: 20px;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.syncing {
		font-size: 1rem;
		color: #888;
		margin-left: 10px;
		font-weight: normal;
	}

	.todo-form {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	.todo-form input[type='text'] {
		flex-grow: 1;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 16px;
	}

	.todo-form button {
		padding: 10px 15px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.2s ease;
	}

	.todo-form button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.todo-form button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.todo-list {
		list-style: none;
		padding: 0;
	}

	.todo-item {
		display: flex;
		align-items: center;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
	}

	.todo-item:last-child {
		border-bottom: none;
	}

	.todo-item input[type='checkbox'] {
		margin-right: 10px;
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.todo-item span {
		flex-grow: 1;
		font-size: 18px;
		color: #333;
	}

	.todo-item span.completed {
		text-decoration: line-through;
		color: #888;
	}

	.todo-item button {
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 5px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s ease;
	}

	.todo-item button:hover:not(:disabled) {
		background-color: #c82333;
	}

	.todo-item button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #dc3545;
		text-align: center;
		font-weight: bold;
	}
</style>
