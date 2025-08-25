<script lang="ts">
	// 匯入我們在 store 中建立的工廠函數。
	// 注意這裡的重點：這個 UI 元件完全不需要知道 TanStack Query 的內部細節。
	// 所有的查詢和變異邏輯都被優雅地封裝在 `createTodoStore` 中了。
	import { createTodoStore } from '$lib/stores/todoStore'

	// 執行工廠函數，並從回傳的物件中解構出所有我們需要的查詢和變異物件。
	// 這種模式讓元件的 script 部分變得極為簡潔和具可讀性。
	// 我們只關心「什麼資料」和「能做什麼」，而不用關心「如何獲取或更新」。
	const { todosQuery, addTodoMutation, updateTodoMutation, deleteTodoMutation } = createTodoStore()

	// 使用 Svelte 5 的 $state 來管理表單輸入，這是一個元件本地的狀態。
	let newTodoText = $state('')

	// 表單提交處理函式
	function handleAddTodo(event: Event) {
		event.preventDefault()
		if (newTodoText.trim()) {
			// 直接呼叫從 store 中獲取的變異函數的 mutate 方法
			$addTodoMutation.mutate(newTodoText)
			newTodoText = ''
		}
	}

	// 更新待辦事項的完成狀態
	function handleToggleTodo(todo: Todo) {
		// 呼叫更新變異，傳入更新後的 todo 物件
		$updateTodoMutation.mutate({ ...todo, completed: !todo.completed })
	}

	// 刪除待辦事項
	function handleDeleteTodo(id: number) {
		// 呼叫刪除變異
		$deleteTodoMutation.mutate(id)
	}
</script>

<!--
  模板部分與 v1 版本非常相似，但現在它直接使用從 store 中解構出來的查詢和變異狀態。
  Svelte 的 ` 語法可以自動訂閱 TanStack Query 的 store，並在狀態變更時重新渲染畫面。
-->
<div class="container">
	<h1>
		待辦事項列表 (v2)
		<!-- 狀態機：當 isFetching 為 true 且 isLoading 為 false 時，顯示「同步中」 -->
		<!-- 這提供了比單純的「載入中」更精確的用戶反饋 -->
		{#if $todosQuery.isFetching && !$todosQuery.isLoading}<span class="syncing">(同步中...)</span
			>{/if}
	</h1>

	<form onsubmit={handleAddTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<!-- 按鈕的禁用狀態直接綁定到新增變異的 isPending 狀態 -->
		<button type="submit" disabled={$addTodoMutation.isPending}
			>新增 {$addTodoMutation.isPending ? '中...' : ''}</button
		>
	</form>

	<!-- 根據查詢的狀態來決定顯示哪個區塊 -->
	{#if $todosQuery.isLoading}
		<!-- isLoading: 查詢正在進行初次載入，且沒有快取資料 -->
		<p>載入中...</p>
	{:else if $todosQuery.error}
		<!-- error: 查詢發生錯誤 -->
		<p class="error">錯誤: {$todosQuery.error.message}</p>
	{:else if !$todosQuery.data || $todosQuery.data.length === 0}
		<!-- data: 查詢成功，但沒有資料 -->
		<p>目前沒有待辦事項。</p>
	{:else}
		<!-- 查詢成功且有資料，遍歷並顯示列表 -->
		<ul class="todo-list">
			{#each $todosQuery.data as todo (todo.id)}
				<li class="todo-item">
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => handleToggleTodo(todo)}
						disabled={$updateTodoMutation.isPending}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button onclick={() => handleDeleteTodo(todo.id)} disabled={$deleteTodoMutation.isPending}
						>刪除</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- CSS 樣式與 v1 版本幾乎相同 -->
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
