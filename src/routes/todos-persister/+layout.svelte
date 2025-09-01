<script lang="ts">
	import {
		queryClient,
		hydrate,
		persister,
		PersistQueryClientProvider
	} from '$lib/stores/queryClient'

	let data = $props()

	hydrate(queryClient, data.dehydratedState)
</script>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
	{@render data.children()}
</PersistQueryClientProvider>
