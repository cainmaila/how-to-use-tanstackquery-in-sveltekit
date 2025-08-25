<script lang="ts">
	import { createTodoStore, type Todo } from '$lib/stores/todoStore.svelte'

	const { todosQuery, addTodoMutation, updateTodoMutation, deleteTodoMutation } = createTodoStore()

	let newTodoText = $state('')

	function handleAddTodo(event: Event) {
		event.preventDefault()
		if (newTodoText.trim()) {
			$addTodoMutation.mutate(newTodoText)
			newTodoText = ''
		}
	}

	function handleToggleTodo(id: number, completed: boolean) {
		const todoToUpdate = $todosQuery.data?.find((todo) => todo.id === id)
		if (todoToUpdate) {
			$updateTodoMutation.mutate({ ...todoToUpdate, completed })
		}
	}

	function handleDeleteTodo(id: number) {
		$deleteTodoMutation.mutate(id)
	}
</script>

<div class="container">
	<h1>待辦事項列表 (v2)</h1>

	<form onsubmit={handleAddTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<button type="submit" disabled={$addTodoMutation.isPending}
			>新增 {$addTodoMutation.isPending ? '中...' : ''}</button
		>
	</form>

	{#if $todosQuery.isLoading || $todosQuery.isFetching}
		<p>載入中...</p>
	{:else if $todosQuery.error}
		<p class="error">錯誤: {$todosQuery.error.message}</p>
	{:else if !$todosQuery.data || $todosQuery.data.length === 0}
		<p>目前沒有待辦事項。</p>
	{:else}
		<ul class="todo-list">
			{#each $todosQuery.data as todo (todo.id)}
				<li class="todo-item">
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => handleToggleTodo(todo.id, !todo.completed)}
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
