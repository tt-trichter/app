<script lang="ts">
	import { page } from '$app/state';
	import type { ActiveTab } from '$lib/components/dock/dock';
	import Dock from '$lib/components/dock/Dock.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	let active: ActiveTab = $derived.by(() => {
		const path = page.url.pathname;
		if (path.startsWith('/app/feed')) return 'Feed';
		if (path.startsWith('/app/leaderboard')) return 'Leaderboard';
		if (path.startsWith('/app/profile')) return 'Profile';
		return 'Other';
	});
</script>

<svelte:head>
	<title>Trichter - App</title>
	<meta name="description" content="Trichter app for tracking and sharing your runs." />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="relative min-h-screen pb-20">
	<div class="flex w-full flex-col items-center px-4 sm:px-6 lg:px-8">
		<div class="w-full max-w-7xl flex-1">{@render children()}</div>
	</div>
</div>

<ToastContainer />
<Dock {active} />
