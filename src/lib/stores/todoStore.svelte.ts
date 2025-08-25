import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'
import { get } from 'svelte/store'

// Define the Todo interface (export it so it can be imported elsewhere)
export interface Todo {
	id: number
	text: string
	completed: boolean
}

// API functions (reusing the existing API)
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

// 簡化的 todo store 工廠函數
// 這個函數直接返回 TanStack Query 的 stores，沒有進一步封裝
// 讓組件能夠直接使用 $ 語法訪問響應式狀態
export function useTodoStore() {
	if (!browser) {
		// SSR 時返回假的 stores
		const mockStore = {
			subscribe: () => () => {},
			data: [],
			isLoading: false,
			error: null,
			isSuccess: true
		}

		const mockMutation = {
			subscribe: () => () => {},
			isPending: false,
			error: null,
			mutate: () => {},
			mutateAsync: () => Promise.resolve()
		}

		return {
			todosQuery: mockStore,
			addTodoMutation: mockMutation,
			updateTodoMutation: mockMutation,
			deleteTodoMutation: mockMutation
		}
	}

	const queryClient = useQueryClient()

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

	return {
		todosQuery,
		addTodoMutation,
		updateTodoMutation,
		deleteTodoMutation
	}
}

// 封裝函數，提供簡化的 API 並隱藏 TanStack Query 的複雜性
export function createTodoStore() {
	if (!browser) {
		// SSR 時返回假的 store
		return {
			todos: [],
			isLoading: false,
			isFetching: false,
			error: null,
			isAdding: false,
			isUpdating: false,
			isRemoving: false,
			add: () => {},
			update: () => {},
			remove: () => {}
		}
	}

	const { todosQuery, addTodoMutation, updateTodoMutation, deleteTodoMutation } = useTodoStore()

	// 使用 Svelte 的 runes 來創建響應式狀態
	let todos = $state<Todo[]>([])
	let isLoading = $state(false)
	let isFetching = $state(false)
	let error = $state<Error | null>(null)
	let isAdding = $state(false)
	let isUpdating = $state(false)
	let isRemoving = $state(false)

	// 使用 $effect 來同步 TanStack Query 的狀態
	$effect(() => {
		const queryState = get(todosQuery)
		todos = queryState.data ?? []
		isLoading = queryState.isLoading
		isFetching = queryState.isFetching
		error = queryState.error
	})

	$effect(() => {
		isAdding = get(addTodoMutation).isPending
	})

	$effect(() => {
		isUpdating = get(updateTodoMutation).isPending
	})

	$effect(() => {
		isRemoving = get(deleteTodoMutation).isPending
	})

	return {
		get todos() {
			return todos
		},
		get isLoading() {
			return isLoading
		},
		get isFetching() {
			return isFetching
		},
		get error() {
			return error
		},
		get isAdding() {
			return isAdding
		},
		get isUpdating() {
			return isUpdating
		},
		get isRemoving() {
			return isRemoving
		},

		// 操作函數
		add: (text: string) => {
			get(addTodoMutation).mutate(text)
		},
		update: (todo: Todo) => {
			get(updateTodoMutation).mutate(todo)
		},
		remove: (id: number) => {
			get(deleteTodoMutation).mutate(id)
		}
	}
}
