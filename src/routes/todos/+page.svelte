<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { browser } from '$app/environment'
	import type { Todo } from '$lib/types' // <--- CHANGED

	// API functions are now local to this component
	const fetchTodos = async (): Promise<Todo[]> => {
		const res = await fetch('/api/todos')
		if (!res.ok) {
			throw new Error('Failed to fetch todos')
		}
		return res.json()
	}

	const addTodoApi = async (text: string): Promise<Todo> => {
		const res = await fetch('/api/todos', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ text })
		})
		if (!res.ok) {
			throw new Error('Failed to add todo')
		}
		return res.json()
	}

	const updateTodoApi = async (todo: Todo): Promise<Todo> => {
		const res = await fetch(`/api/todos`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(todo)
		})
		if (!res.ok) {
			throw new Error('Failed to update todo')
		}
		return res.json()
	}

	const deleteTodoApi = async (id: number): Promise<void> => {
		const res = await fetch(`/api/todos`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id })
		})
		if (!res.ok) {
			throw new Error('Failed to delete todo')
		}
	}

	const queryClient = useQueryClient()

	// We only want to run queries on the client
	const todosQuery = createQuery({
		queryKey: ['todos'],
		queryFn: fetchTodos,
		enabled: browser
	})

	const addTodoMutation = createMutation({
		mutationFn: addTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	let newTodoText = $state('')

	function addTodo(event: SubmitEvent) {
		event.preventDefault()
		if (!newTodoText.trim()) return
		$addTodoMutation.mutate(newTodoText)
		newTodoText = ''
	}

	function toggleTodo(todo: Todo) {
		$updateTodoMutation.mutate({ ...todo, completed: !todo.completed })
	}

	function deleteTodo(id: number) {
		$deleteTodoMutation.mutate(id)
	}
</script>

<div class="container">
	<h1>
		待辦事項列表 {#if $todosQuery.isFetching && !$todosQuery.isLoading}<span class="syncing"
				>(同步中...)</span
			>{/if}
	</h1>

	<form onsubmit={addTodo} class="todo-form">
		<input type="text" bind:value={newTodoText} placeholder="新增待辦事項" />
		<button type="submit" disabled={$addTodoMutation.isPending}
			>新增 {$addTodoMutation.isPending ? '中...' : ''}</button
		>
	</form>

	{#if $todosQuery.isLoading}
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
						onchange={() => toggleTodo(todo)}
						disabled={$updateTodoMutation.isPending}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button onclick={() => deleteTodo(todo.id)} disabled={$deleteTodoMutation.isPending}
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
