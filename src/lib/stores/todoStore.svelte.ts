// src/lib/stores/todoStore.svelte.ts
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'
import type { Todo } from '$lib/types' // <--- CHANGED

// API functions
export const fetchTodos = async (): Promise<Todo[]> => {
	const res = await fetch('/api/todos')
	if (!res.ok) {
		throw new Error('Failed to fetch todos')
	}
	return res.json()
}

export const addTodoApi = async (text: string): Promise<Todo> => {
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

export const updateTodoApi = async (todo: Todo): Promise<Todo> => {
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

export const deleteTodoApi = async (id: number): Promise<void> => {
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

// This function returns the raw TanStack Query stores.
// It's intended to be used in Svelte components to encapsulate query logic.
export function createTodoStore() {
	// On the server, we return mock stores to prevent queries from running.
	// The actual queries will run on the client during hydration.
	if (!browser) {
		const mockQuery = (data: any = []) => ({
			subscribe: () => () => {},
			data,
			isLoading: true,
			isFetching: false,
			error: null,
			isSuccess: false
		})

		const mockMutation = {
			subscribe: () => () => {},
			isPending: false,
			error: null,
			mutate: () => {},
			mutateAsync: async () => Promise.resolve()
		}

		return {
			todosQuery: mockQuery([]),
			addTodoMutation: mockMutation,
			updateTodoMutation: mockMutation,
			deleteTodoMutation: mockMutation
		}
	}

	const queryClient = useQueryClient()

	const todosQuery = createQuery<Todo[]>({
		queryKey: ['todos'],
		queryFn: fetchTodos
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

	return {
		todosQuery,
		addTodoMutation,
		updateTodoMutation,
		deleteTodoMutation
	}
}
