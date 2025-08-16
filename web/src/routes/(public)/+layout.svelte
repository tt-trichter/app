<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen w-full flex-col items-center justify-between align-middle">
	<div></div>
	<div>{@render children()}</div>
	<Footer />
</div>
