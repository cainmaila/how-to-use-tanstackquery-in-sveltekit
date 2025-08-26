import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 將 todos 的型別定義得更完整
interface Todo {
	id: number
	text: string
	completed?: boolean
}

const todos: Todo[] = [
	{ id: 1, text: 'Learn SvelteKit', completed: true },
	{ id: 2, text: 'Learn TanStack Query', completed: false }
]

export const GET: RequestHandler = async ({ url }) => {
	// Added async
	await new Promise((resolve) => setTimeout(resolve, 1000)) // Added delay

	const status = url.searchParams.get('status')

	if (status && status !== 'all') {
		const completed = status === 'completed'
		const filteredTodos = todos.filter((todo) => todo.completed === completed)
		return json(filteredTodos)
	}

	return json(todos)
}

export const POST: RequestHandler = async ({ request }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000)) // Added delay
	const { text } = await request.json()
	const newTodo: Todo = {
		id: Date.now(), // 使用時間戳作為 ID，確保唯一性
		text,
		completed: false
	}
	todos.push(newTodo)
	return json(newTodo, { status: 201 })
}

export const PUT: RequestHandler = async ({ request }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000)) // Added delay
	const updatedTodo = await request.json()
	const index = todos.findIndex((todo) => todo.id === updatedTodo.id)

	if (index === -1) {
		return json({ error: 'Todo not found' }, { status: 404 })
	}

	// 更新待辦事項
	todos[index] = { ...todos[index], ...updatedTodo }
	return json(todos[index])
}

export const DELETE: RequestHandler = async ({ request }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000)) // Added delay
	const { id } = await request.json()
	const index = todos.findIndex((todo) => todo.id === id)

	if (index === -1) {
		return json({ error: 'Todo not found' }, { status: 404 })
	}

	// 刪除待辦事項
	const deletedTodo = todos.splice(index, 1)[0]
	return json(deletedTodo)
}
