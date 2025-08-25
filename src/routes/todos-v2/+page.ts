import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
	// This load function can be used to trigger the initial data fetch on the server
	// for SSR. The createTodoStore function will handle the actual query.
	// We don't need to return anything specific here as the store manages its own state.
	// However, if you wanted to pre-fetch data and pass it to the store, you could do so here.

	// Example: If you wanted to pre-fetch todos on the server for SSR
	// const todoStore = createTodoStore();
	// await todoStore.todosQuery.prefetch(); // Assuming todosQuery is exposed or a prefetch method exists

	return {}
}
