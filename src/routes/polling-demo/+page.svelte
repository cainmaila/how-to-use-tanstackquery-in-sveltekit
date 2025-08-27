<!-- src/routes/polling-demo/+page.svelte -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'

	// 建立一個查詢來獲取伺服器時間
	const timeQuery$ = createQuery<{
		time: string
	}>({
		queryKey: ['server-time'],
		queryFn: async () => {
			const response = await fetch('/api/time')
			if (!response.ok) {
				throw new Error('Network response was not ok')
			}
			return response.json()
		},
		// 核心選項：設定 refetchInterval 為 2000 毫秒 (2秒)
		// 這會讓 TanStack Query 每 2 秒自動重新執行一次 queryFn。
		refetchInterval: 2000,

		// (可選) 當瀏覽器分頁不在前景時，停止輪詢。
		// 這可以節省資源。
		refetchIntervalInBackground: false
	})
</script>

<main>
	<h1>TanStack Query Polling Demo</h1>
	<p>這個範例展示了如何使用 <code>refetchInterval</code> 選項來實現資料輪詢。</p>

	{#if $timeQuery$.isLoading}
		<p>Loading initial server time...</p>
	{:else if $timeQuery$.isError}
		<p style="color: red;">Error: {$timeQuery$.error.message}</p>
	{:else if $timeQuery$.data}
		<div style="border: 1px solid #ccc; padding: 1rem; margin-top: 1rem;">
			<h2>Current Server Time:</h2>
			<p style="font-size: 2rem; font-family: monospace;">
				{new Date($timeQuery$.data.time).toLocaleTimeString('en-US', { hour12: false })}
			</p>
			<p>
				<small>Last updated at: {new Date($timeQuery$.dataUpdatedAt).toLocaleTimeString()}</small>
			</p>
			{#if $timeQuery$.isFetching}
				<p><small><em>(Syncing...)</em></small></p>
			{/if}
		</div>
	{/if}
</main>
