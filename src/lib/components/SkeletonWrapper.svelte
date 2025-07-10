<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		isLoading = false,
		width = 'auto',
		height = 'auto',
		rounded = false,
		animationDelay = 0,
		children
	}: {
		isLoading?: boolean;
		width?: string;
		height?: string;
		rounded?: boolean;
		animationDelay?: number;
		children?: Snippet;
	} = $props();

	const roundedClass = rounded ? 'rounded' : '';
	const skeletonStyle = `width: ${width}; height: ${height}; animation-delay: ${animationDelay}s;`;
</script>

{#if isLoading}
	<div class="skeleton {roundedClass}" style={skeletonStyle}></div>
{:else}
	{@render children?.()}
{/if}
