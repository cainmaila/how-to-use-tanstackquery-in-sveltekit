// src/lib/stores/todoStore.ts

// 匯入 TanStack Svelte Query 的核心功能
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
// 匯入 Svelte store 的 `derived` 函數，用於從其他 store 衍生新 store
// 匯入 `get` 函數，用於在非響應式上下文（如普通函數）中獲取 store 的當前值
import { derived, get } from 'svelte/store'
// 匯入我們封裝好的 API 請求函數
import { fetchTodos, addTodoApi, updateTodoApi, deleteTodoApi } from '$lib/sdk'

/**
 * 這是一個更高層次的工廠函數 (Factory Function)，旨在完全將 UI 元件與 TanStack Query 解耦。
 * 它的核心思想是將所有與待辦事項 (todos) 相關的資料操作邏輯（查詢、新增、更新、刪除）
 * 封裝在一個單一的、可重複使用的介面中。
 *
 * 透過這種方式，UI 元件不需要直接與 TanStack Query 的 `createQuery` 或 `createMutation` 互動，
 * 也不需要處理 ` 前綴來訂閱 store。它只會使用這個 store 提供的簡潔屬性（如 `todos`, `isLoading`）
 * 和方法（如 `add`, `update`, `remove`）。
 *
 * 這大大提升了程式碼的可讀性、可維護性和可測試性，並使得未來更換底層資料庫或狀態管理庫變得更加容易。
 */
export function createTodoStore() {
	const queryClient = useQueryClient()

	// --- 內部 TanStack Query 核心邏輯 ---
	// 這些是實際與 TanStack Query 互動的部分，它們返回的是 TanStack Query 自己的 store。

	// 建立一個查詢 (Query) 來獲取待辦事項列表。
	// `queryKey` 是此查詢的唯一標識符，用於快取和失效。
	// `queryFn` 是執行實際資料獲取的異步函數。
	const todosQuery = createQuery<Todo[]>({
		queryKey: ['todos'],
		queryFn: fetchTodos
	})

	const addTodoMutation = createMutation({
		mutationFn: addTodoApi,
		onSuccess: () => {
			// 當新增成功後，讓 `todos` 查詢失效。這會觸發 TanStack Query 自動重新獲取最新的待辦事項列表。
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const updateTodoMutation = createMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			// 更新成功後，同樣讓 `todos` 查詢失效，確保 UI 資料是最新的。
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const deleteTodoMutation = createMutation({
		mutationFn: deleteTodoApi,
		onSuccess: () => {
			// 刪除成功後，讓 `todos` 查詢失效。
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// --- 轉接器層 (Adapter Layer) ---
	// 這一層的目的是將 TanStack Query 返回的複雜 store 轉換為更簡單、更直接的 Svelte store。
	// 這樣，UI 元件就不需要了解 TanStack Query store 的內部結構（如 `.data`, `.isLoading` 等）。

	// `derived` 函數接收一個或多個 store 作為輸入，並返回一個新的 store。
	// 當輸入 store 的值變化時，`derived` store 的值也會自動更新。

	// 衍生出 `todos store，包含實際的待辦事項資料。如果資料為空，則返回空陣列。
	const todos$ = derived(todosQuery, ($todosQuery) => $todosQuery.data ?? [])
	// 衍生出 `isLoading store，表示查詢是否正在進行初次載入。
	const isLoading$ = derived(todosQuery, ($todosQuery) => $todosQuery.isLoading)
	// 衍生出 `isFetching store，表示查詢是否正在背景重新獲取資料（例如，在資料過期後）。
	const isFetching$ = derived(todosQuery, ($todosQuery) => $todosQuery.isFetching)
	// 衍生出 `error store，包含查詢或變異過程中發生的錯誤資訊。
	const error$ = derived(todosQuery, ($todosQuery) => $todosQuery.error)

	// 衍生出 `isAdding store，表示新增待辦事項的變異是否正在進行中。
	const isAdding$ = derived(addTodoMutation, ($addTodoMutation) => $addTodoMutation.isPending)
	// 衍生出 `isUpdating store，表示更新待辦事項的變異是否正在進行中。
	const isUpdating$ = derived(
		updateTodoMutation,
		($updateTodoMutation) => $updateTodoMutation.isPending
	)
	// 衍生出 `isDeleting store，表示刪除待辦事項的變異是否正在進行中。
	const isDeleting$ = derived(
		deleteTodoMutation,
		($deleteTodoMutation) => $deleteTodoMutation.isPending
	)

	// --- 封裝操作方法 ---
	// 這些函數封裝了實際觸發 TanStack Query 變異的操作。
	// 透過 `get(store)` 函數，我們可以在非響應式上下文（如普通函數）中獲取 store 的當前值，
	// 然後呼叫其上的 `mutate` 方法。

	// 封裝新增待辦事項的方法。
	function add(text: string) {
		get(addTodoMutation).mutate(text)
	}

	// 封裝更新待辦事項的方法。
	function update(todo: Todo) {
		get(updateTodoMutation).mutate(todo)
	}

	// 封裝刪除待辦事項的方法。
	function remove(id: number) {
		get(deleteTodoMutation).mutate(id)
	}

	// --- 返回簡潔 API ---
	// 將所有衍生出的 store 和封裝好的操作方法作為一個物件返回。
	// UI 元件只需要解構這個物件，並使用 ` 前綴來訂閱 store，或直接呼叫方法。
	// 這樣，UI 元件就完全不需要了解底層的 TanStack Query 實現細節。
	return {
		todos$,
		isLoading$,
		isFetching$,
		error$,
		isAdding$,
		isUpdating$,
		isDeleting$,
		add,
		update,
		remove
	}
}
