# 7. 封裝 TanStack Query (範例位於 `/todos-v2` 路由)

在本節中，我們將探討如何將 TanStack Query 的 `createQuery`、`createMutation` 和 `useQueryClient` 行為封裝到一個全域的 Svelte 5 runes 反應式狀態中。這種模式有助於將資料獲取和變更邏輯與 UI 組件分離，使 UI 更簡潔，並提高程式碼的可重用性和可維護性。

## 為什麼要封裝？

- **關注點分離 (Separation of Concerns)**：將資料邏輯從 UI 組件中抽離，使每個部分只負責單一職責。
- **程式碼重用**：可以在多個組件中重用相同的資料獲取和變更邏輯，而無需重複程式碼。
- **測試性**：更容易對獨立的資料邏輯進行單元測試。
- **簡潔的 UI**：UI 組件只負責渲染資料和觸發操作，而無需關心資料是如何獲取或變更的。
- **更好的類型推斷**：通過明確定義 store 的介面，可以獲得更好的類型推斷。

## 實作細節

我們將建立一個 `todoStore.ts` 檔案，它將包含所有與待辦事項相關的 TanStack Query 邏輯。

### `src/lib/stores/todoStore.ts`

```typescript
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'

// Define the Todo interface
interface Todo {
	id: string
	text: string
	completed: boolean
}

// API functions (reusing the existing API)
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

const deleteTodoApi = async (id: string): Promise<void> => {
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

// Svelte 5 Runes based Todo Store
export function createTodoStore() {
	const queryClient = useQueryClient()

	// Query for fetching todos
	const todosQuery = createQuery({
		queryKey: ['todos'],
		queryFn: fetchTodos,
		// Only enable the query on the client side to avoid double fetching on SSR
		enabled: browser
	})

	// Mutation for adding a todo
	const addTodoMutation = createMutation({
		mutationFn: addTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// Mutation for updating a todo
	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// Mutation for deleting a todo
	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// Expose reactive state and methods
	return {
		get todos() {
			return todosQuery.data ?? []
		},
		get isLoadingTodos() {
			return todosQuery.isLoading
		},
		get isFetchingTodos() {
			return todosQuery.isFetching
		},
		get todosError() {
			return todosQuery.error
		},
		addTodo: addTodoMutation.mutate,
		updateTodo: updateTodoMutation.mutate,
		deleteTodo: deleteTodoMutation.mutate,
		get isAddingTodo() {
			return addTodoMutation.isPending
		},
		get isUpdatingTodo() {
			return updateTodoMutation.isPending
		},
		get isDeletingTodo() {
			return deleteTodoMutation.isPending
		}
	}
}
```

### `src/routes/todos-v2/+page.svelte`

```svelte
<script lang="ts">
	import { createTodoStore } from '$lib/stores/todoStore'
	import { nanoid } from 'nanoid' // Note: nanoid needs to be installed: pnpm add nanoid

	// 使用 Svelte 5 runes 創建 todoStore 實例
	const todoStore = createTodoStore()

	// 從 store 中解構出狀態和方法
	const {
		todos,
		isLoadingTodos,
		isFetchingTodos,
		todosError,
		addTodo,
		updateTodo,
		deleteTodo,
		isAddingTodo,
		isUpdatingTodo,
		isDeletingTodo
	} = todoStore

	let newTodoText = $state('')

	function handleAddTodo() {
		if (newTodoText.trim()) {
			addTodo(newTodoText)
			newTodoText = ''
		}
	}

	function handleToggleTodo(id: string, completed: boolean) {
		const todoToUpdate = todos.find((todo) => todo.id === id)
		if (todoToUpdate) {
			updateTodo({ ...todoToUpdate, completed })
		}
	}

	function handleDeleteTodo(id: string) {
		deleteTodo(id)
	}
</script>

<div class="container">
	<h1>Todo List (v2 - Encapsulated)</h1>

	{#if isLoadingTodos}
		<p>Loading todos...</p>
	{:else if todosError}
		<p class="error">Error: {todosError.message}</p>
	{:else}
		<form onsubmit|preventDefault={handleAddTodo}>
			<input type="text" bind:value={newTodoText} placeholder="Add a new todo" />
			<button type="submit" disabled={isAddingTodo}>
				{#if isAddingTodo}Adding...{:else}Add Todo{/if}
			</button>
		</form>

		{#if isFetchingTodos}
			<p class="fetching-indicator">Fetching updates...</p>
		{/if}

		<ul>
			{#each todos as todo (todo.id)}
				<li>
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => handleToggleTodo(todo.id, !todo.completed)}
						disabled={isUpdatingTodo}
					/>
					<span class:completed={todo.completed}>{todo.text}</span>
					<button onclick={() => handleDeleteTodo(todo.id)} disabled={isDeletingTodo}>
						{#if isDeletingTodo}Deleting...{:else}Delete{/if}
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
		margin-bottom: 20px;
	}

	form {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	input[type='text'] {
		flex-grow: 1;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 16px;
	}

	button {
		padding: 10px 15px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 16px;
	}

	button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
	}

	li:last-child {
		border-bottom: none;
	}

	input[type='checkbox'] {
		margin-right: 10px;
		transform: scale(1.2);
	}

	span {
		flex-grow: 1;
		font-size: 18px;
		color: #555;
	}

	span.completed {
		text-decoration: line-through;
		color: #aaa;
	}

	.error {
		color: red;
		text-align: center;
	}

	.fetching-indicator {
		text-align: center;
		color: #007bff;
		font-style: italic;
		margin-bottom: 10px;
	}
</style>
```

## 總結

通過這種封裝模式，我們將 TanStack Query 的複雜性隱藏在 `todoStore` 內部，使 `+page.svelte` 組件只專注於 UI 渲染和使用者互動。這大大提高了程式碼的清晰度、可維護性和可重用性。
