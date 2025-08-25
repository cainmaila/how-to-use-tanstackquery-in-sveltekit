<script lang="ts">
	// 匯入經過二次封裝的 store 工廠函數
	import { createTodoStore } from '$lib/stores/todoStore.svelte'

	// 注意看，現在的解構出來的都是簡單的變數和函數名，完全看不出 TanStack Query 的痕跡
	const {
		todos,
		isLoading,
		isFetching,
		error,
		isAdding,
		isUpdating,
		isDeleting,
		add,
		update,
		remove
	} = createTodoStore()

	// 元件本地狀態
	let newTodoText = $state('')

	// 事件處理函數現在直接呼叫從 store 得到的簡潔方法
	function handleAddTodo(event: Event) {
		event.preventDefault()
		if (newTodoText.trim()) {
			add(newTodoText)
			newTodoText = ''
		}
	}

	function handleToggleTodo(todo: Todo) {
		update({ ...todo, completed: !todo.completed })
	}

	function handleDeleteTodo(id: number) {
		remove(id)
	}
</script>

<!--
	模板現在也變得更直觀，直接使用 isAdding, isUpdating 等變數。
	因為這些變數是透過 Rune 衍生的，它們本身就是響應式的，所以不需要 ` 符號。
-->
<div class="container">
	<h1>
		待辦事項列表 (v2)
		{#if $isFetching && !$isLoading}<span class="syncing">(同步中...)</span>{/if}
	</h1>

	<form onsubmit={handleAddTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<button type="submit" disabled={$isAdding}>新增 {$isAdding ? '中...' : ''}</button>
	</form>

	{#if $isLoading}
		<p>載入中...</p>
	{:else if $error}
		<p class="error">錯誤: {$error.message}</p>
	{:else if !$todos || $todos.length === 0}
		<p>目前沒有待辦事項。</p>
	{:else}
		<ul class="todo-list">
			{#each $todos as todo (todo.id)}
				<li class="todo-item">
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => handleToggleTodo(todo)}
						disabled={$isUpdating}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button onclick={() => handleDeleteTodo(todo.id)} disabled={$isDeleting}>刪除</button>
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
