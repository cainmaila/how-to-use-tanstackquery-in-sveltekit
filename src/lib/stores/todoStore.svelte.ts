// src/lib/stores/todoStore.svelte.ts
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { fetchTodos, addTodoApi, updateTodoApi, deleteTodoApi } from '$lib/sdk' // <--- CHANGED

// This function returns the raw TanStack Query stores.
// It's intended to be used in Svelte components to encapsulate query logic.
export function createTodoStore() {
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
