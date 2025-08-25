<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	// 匯入 API 請求函式
	import { fetchTodos, addTodoApi, updateTodoApi, deleteTodoApi } from '$lib/sdk'

	// 取得 QueryClient 的實例，用於後續的快取操作
	const queryClient = useQueryClient()

	// 建立一個查詢 (Query) 來取得待辦事項列表
	// 這是一個響應式物件，其狀態會自動更新
	const todosQuery = createQuery({
		// 'queryKey' 是此查詢的唯一標識符，用於快取和後續操作
		queryKey: ['todos'],
		// 'queryFn' 是執行實際資料獲取的函式，它必須回傳一個 Promise
		queryFn: fetchTodos
	})

	// 建立一個變異 (Mutation) 來新增待辦事項
	const addTodoMutation = createMutation({
		// 'mutationFn' 是執行實際變異操作的函式
		mutationFn: addTodoApi,
		// 'onSuccess' 是變異成功後的回呼函式
		onSuccess: () => {
			// 當新增成功後，我們讓 'todos' 查詢失效
			// 這會觸發 TanStack Query 自動重新獲取最新的待辦事項列表
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 建立一個變異來更新待辦事項
	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			// 同樣地，更新成功後也讓 'todos' 查詢失效
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 建立一個變異來刪除待辦事項
	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => {
			// 刪除成功後也讓 'todos' 查詢失效
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 使用 Svelte 5 的 $state 來管理新待辦事項的輸入文字
	let newTodoText = $state('')

	// 新增待辦事項的表單提交處理函式
	function addTodo(event: SubmitEvent) {
		event.preventDefault() // 防止表單預設的提交行為
		if (!newTodoText.trim()) return // 如果輸入為空，則不執行任何操作
		// 執行新增變異，並傳入新的待辦事項文字
		$addTodoMutation.mutate(newTodoText)
		newTodoText = '' // 清空輸入框
	}

	// 切換待辦事項的完成狀態
	function toggleTodo(todo: Todo) {
		// 執行更新變異，傳入一個新的 todo 物件，其中 'completed' 狀態被反轉
		$updateTodoMutation.mutate({ ...todo, completed: !todo.completed })
	}

	// 刪除待辦事項
	function deleteTodo(id: number) {
		// 執行刪除變異，並傳入要刪除的 todo 的 id
		$deleteTodoMutation.mutate(id)
	}
</script>

<!-- Svelte 的模板語法 -->
<div class="container">
	<h1>
		待辦事項列表
		{#if $todosQuery.isFetching && !$todosQuery.isLoading}
			<!--
        $todosQuery.isFetching: 表示正在背景重新獲取資料 (例如，因為 invalidateQueries)
        $todosQuery.isLoading: 表示正在進行初次載入
        這個 span 會在背景同步資料時顯示
      -->
			<span class="syncing">(同步中...)</span>
		{/if}
	</h1>

	<!-- 新增待辦事項的表單 -->
	<form onsubmit={addTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<button type="submit" disabled={$addTodoMutation.isPending}>
			<!-- $addTodoMutation.isPending: 表示新增操作正在進行中 -->
			新增 {$addTodoMutation.isPending ? '中...' : ''}
		</button>
	</form>

	<!-- 根據查詢狀態顯示不同的 UI -->
	{#if $todosQuery.isLoading}
		<!-- 正在初次載入時顯示 -->
		<p>載入中...</p>
	{:else if $todosQuery.error}
		<!-- 發生錯誤時顯示錯誤訊息 -->
		<p class="error">錯誤: {$todosQuery.error.message}</p>
	{:else if !$todosQuery.data || $todosQuery.data.length === 0}
		<!-- 沒有資料時顯示 -->
		<p>目前沒有待辦事項。</p>
	{:else}
		<!-- 成功獲取資料後，顯示待辦事項列表 -->
		<ul class="todo-list">
			{#each $todosQuery.data as todo (todo.id)}
				<li class="todo-item">
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => toggleTodo(todo)}
						disabled={$updateTodoMutation.isPending}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button onclick={() => deleteTodo(todo.id)} disabled={$deleteTodoMutation.isPending}>
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
