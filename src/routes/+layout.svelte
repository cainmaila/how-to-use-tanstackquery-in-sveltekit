<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import type { LayoutData } from './$types'

	// 從 load 函數中獲取數據和子組件
	const { children } = $props<{ children: any }>()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
