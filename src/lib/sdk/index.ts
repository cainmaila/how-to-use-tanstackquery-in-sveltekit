// src/lib/sdk/index.ts
import type { Todo } from '$lib/types'

/**
 * 從 API 獲取所有待辦事項。
 * @returns A promise that resolves to an array of todos.
 */
export const fetchTodos = async (): Promise<Todo[]> => {
	const res = await fetch('/api/todos')
	if (!res.ok) {
		throw new Error('獲取待辦事項失敗')
	}
	return res.json()
}

/**
 * 新增一個待辦事項。
 * @param text - 新待辦事項的文字內容。
 * @returns A promise that resolves to the newly created todo.
 */
export const addTodoApi = async (text: string): Promise<Todo> => {
	const res = await fetch('/api/todos', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ text })
	})
	if (!res.ok) {
		throw new Error('新增待辦事項失敗')
	}
	return res.json()
}

/**
 * 更新一個現有的待辦事項。
 * @param todo - 包含更新屬性的待辦事項物件。
 * @returns A promise that resolves to the updated todo.
 */
export const updateTodoApi = async (todo: Todo): Promise<Todo> => {
	const res = await fetch(`/api/todos`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(todo)
	})
	if (!res.ok) {
		throw new Error('更新待辦事項失敗')
	}
	return res.json()
}

/**
 * 根據 ID 刪除一個待辦事項。
 * @param id - 要刪除的待辦事項的 ID。
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteTodoApi = async (id: number): Promise<void> => {
	const res = await fetch(`/api/todos`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	})
	if (!res.ok) {
		throw new Error('刪除待辦事項失敗')
	}
}
