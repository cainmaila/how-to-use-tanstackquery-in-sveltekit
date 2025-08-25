// src/lib/stores/todoStore.svelte.ts

import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { derived, get } from 'svelte/store'
import { fetchTodos, addTodoApi, updateTodoApi, deleteTodoApi } from '$lib/sdk'

/**
 * 這是一個更高層次的工廠函數，旨在完全將 UI 元件與 TanStack Query 解耦。
 * 它在內部使用 `createTodoStore` 的核心邏輯，但對外暴露一個更簡單、更通用的介面。
 */
export function createTodoStore() {
	const queryClient = useQueryClient()

	// 內部仍然使用 TanStack Query 的 stores
	const todosQuery = createQuery<Todo[]>({
		queryKey: ['todos'],
		queryFn: fetchTodos
	})

	const addTodoMutation = createMutation({
		mutationFn: addTodoApi,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
	})

	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
	})

	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
	})

	// --- 轉接器層 (Adapter Layer) ---
	// 使用 Svelte 傳統的 `derived` store 從 TanStack Query stores 衍生出簡單的狀態。
	// 這樣，消費此 store 的元件就需要使用 ` 前綴來訂閱這些 store 的值。

	const todos = derived(todosQuery, ($todosQuery) => $todosQuery.data ?? [])
	const isLoading = derived(todosQuery, ($todosQuery) => $todosQuery.isLoading)
	const isFetching = derived(todosQuery, ($todosQuery) => $todosQuery.isFetching)
	const error = derived(todosQuery, ($todosQuery) => $todosQuery.error)

	const isAdding = derived(addTodoMutation, ($addTodoMutation) => $addTodoMutation.isPending)
	const isUpdating = derived(
		updateTodoMutation,
		($updateTodoMutation) => $updateTodoMutation.isPending
	)
	const isDeleting = derived(
		deleteTodoMutation,
		($deleteTodoMutation) => $deleteTodoMutation.isPending
	)

	// 封裝 mutate 方法，提供更簡潔的 API
	function add(text: string) {
		get(addTodoMutation).mutate(text)
	}

	function update(todo: Todo) {
		get(updateTodoMutation).mutate(todo)
	}

	function remove(id: number) {
		get(deleteTodoMutation).mutate(id)
	}

	// 返回這個極簡的、與 TanStack Query 完全解耦的 API。
	return {
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
	}
}
