// src/lib/stores/todoStore.ts

// 匯入 TanStack Svelte Query 的核心功能
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
// 匯入我們封裝好的 API 請求函數
import { fetchTodos, addTodoApi, updateTodoApi, deleteTodoApi } from '$lib/sdk'

// 這是一個工廠函數 (factory function)，用於建立與待辦事項 (todos) 相關的所有查詢和變異。
// 透過這種方式封裝，我們可以讓 UI 元件的邏輯更乾淨，並且可以在多個元件中重複使用相同的資料邏輯。
// 這也是一種將資料層與表現層分離的良好實踐。
export function createTodoStore() {
	// 透過 useQueryClient hook 獲取 QueryClient 的實例。
	// 這個 hook 必須在 QueryClientProvider 的上下文中使用。
	const queryClient = useQueryClient()

	// 建立一個查詢 (Query) 來獲取待辦事項列表。
	// 我們明確指定了泛型 <Todo[]> 來告知 TanStack Query 這個查詢預期會返回一個 Todo 陣列。
	const todosQuery = createQuery<Todo[]>({
		// queryKey 是此查詢的唯一標識符。
		queryKey: ['todos'],
		// queryFn 是執行實際資料獲取的函數。
		queryFn: fetchTodos
	})

	// 建立一個變異 (Mutation) 來新增待辦事項。
	const addTodoMutation = createMutation({
		// mutationFn 是執行新增操作的函數。
		mutationFn: addTodoApi,
		// onSuccess 是變異成功後的回呼函式。
		onSuccess: () => {
			// 當新增成功後，我們讓 'todos' 查詢失效 (invalidate)。
			// 這會觸發 TanStack Query 自動重新獲取最新的待辦事項列表，以保持 UI 同步。
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 建立一個變異來更新待辦事項。
	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			// 同樣地，更新成功後也讓 'todos' 查詢失效。
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 建立一個變異來刪除待辦事項。
	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => {
			// 刪除成功後也讓 'todos' 查詢失效。
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// 將所有建立的查詢和變異作為一個物件返回。
	// 這樣，任何使用此 store 的元件都可以輕鬆地存取這些功能。
	return {
		todosQuery,
		addTodoMutation,
		updateTodoMutation,
		deleteTodoMutation
	}
}
