<!-- src/routes/polling-demo/+layout.svelte -->
<script lang="ts">
	import { getQueryClient } from '$lib/queryClient'
	import { hydrate, QueryClientProvider } from '@tanstack/svelte-query'
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { browser } from '$app/environment'
	import type { LayoutData } from '../$types'

	const { data, children } = $props<{ data: LayoutData; children: any }>()

	const queryClient = getQueryClient()
	hydrate(queryClient, data.dehydratedState)
</script>

<QueryClientProvider client={queryClient}>
	{@render children?.()}

	{#if browser}
		<SvelteQueryDevtools />
	{/if}
</QueryClientProvider>
