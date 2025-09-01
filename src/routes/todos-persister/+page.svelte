<!-- src/routes/todos-cache-demo/+page.svelte -->
<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	// 獲取 query client 實例，以便我們可以手動操作快取
	const queryClient = useQueryClient()

	// 1. 使用 Svelte 5 Runes 的 $state 來宣告一個響應式狀態變數。
	let status = $state<'all' | 'active' | 'completed'>('all')

	// 2. 建立查詢。
	// @tanstack/svelte-query v5+ 已與 Svelte 5 Runes 整合。
	// 當你將一個 signal (如此處的 `status`) 傳入 queryKey 或 queryFn 時，
	// TanStack Query 會自動追蹤它的變化。
	const query$ = $derived(
		createQuery<Todo[]>({
			// 3. 當 `status` 的值改變時，這個 queryKey 會自動更新。
			// TanStack Query 會偵測到 key 的變化，並觸發新的資料擷取或從快取讀取。
			queryKey: ['todos', status],
			queryFn: async () => {
				// `status` 在這裡永遠是它最新的值。
				const response = await fetch(`/api/todos?status=${status}`)
				if (!response.ok) {
					throw new Error('Network response was not ok')
				}
				// 為了展示效果，我們刻意讓 API 有延遲
				console.log(`Fetching for status: ${status}...`)
				return response.json()
			}
		})
	)

	function invalidateTodos() {
		// 讓所有 queryKey 以 ['todos'] 開頭的查詢都失效。
		// 這會將它們標記為 "stale" (過時的)，並立即重新獲取當前頁面上活躍的查詢。
		console.log("Invalidating all queries starting with ['todos']...")
		queryClient.invalidateQueries({ queryKey: ['todos'] })
	}
</script>

<main>
	<h1>Todos (Cache Demo with Svelte 5 Runes)</h1>

	<div class="filters">
		<button onclick={() => (status = 'all')}>All</button>
		<button onclick={() => (status = 'active')}>Active</button>
		<button onclick={() => (status = 'completed')}>Completed</button>
	</div>

	<div class="actions" style="margin-bottom: 1rem;">
		<button onclick={invalidateTodos}>Invalidate 'todos' Cache</button>
	</div>

	<p>Current filter: <strong>{status}</strong></p>

	<!-- 4. 在模板中，可以直接使用 `query` signal -->
	{#if $query$.isLoading}
		<p>Loading...</p>
	{:else if $query$.isError}
		<p>Error: {$query$.error.message}</p>
	{:else}
		<ul>
			{#each $query$.data || [] as todo (todo.id)}
				<li>{todo.text} ({todo.completed ? 'Completed' : 'Active'})</li>
			{/each}
		</ul>
		<p>
			<small>Data last updated at: {new Date($query$.dataUpdatedAt).toLocaleTimeString()}</small>
		</p>
	{/if}
</main>

<style>
	.filters {
		margin-bottom: 1rem;
	}
	button {
		margin-right: 0.5rem;
	}
</style>
