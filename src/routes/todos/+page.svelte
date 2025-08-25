<script lang="ts">
	import { createTodoStore } from '../../lib/stores/todoStore'
	import type { Todo } from '../../lib/stores/todoStore'

	const {
		todos,
		isLoading,
		isFetching,
		error,
		isAdding,
		isUpdating,
		isRemoving,
		add,
		update,
		remove
	} = createTodoStore()

	let newTodoText = $state('')

	function addTodo(event: SubmitEvent) {
		event.preventDefault() // 阻止表單的默認提交行為
		if (!newTodoText.trim()) return // 如果輸入為空，則不執行任何操作
		add(newTodoText) // 觸發 mutation，將新的待辦事項發送到伺服器
		newTodoText = '' // 清空輸入框
	}

	function toggleTodo(todo: Todo) {
		update({ ...todo, completed: !todo.completed })
	}

	function deleteTodo(id: number) {
		remove(id)
	}
</script>

<div class="container">
	<h1>待辦事項列表</h1>

	<form onsubmit={addTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<button type="submit" disabled={isAdding}>新增 {isAdding ? '中...' : ''}</button>
	</form>

	{#if isLoading || isFetching}
		<p>載入中...</p>
	{:else if error}
		<p class="error">錯誤: {error.message}</p>
	{:else if todos.length === 0}
		<p>目前沒有待辦事項。</p>
	{:else}
		<ul class="todo-list">
			{#each todos as todo (todo.id)}
				<li class="todo-item">
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => toggleTodo(todo)}
						disabled={isUpdating}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button onclick={() => deleteTodo(todo.id)} disabled={isRemoving}>刪除</button>
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
