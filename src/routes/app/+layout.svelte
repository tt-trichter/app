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

<div class="relative min-h-screen pt-5 pb-20">
	<div class="flex w-full flex-col items-center">
		<div class="w-full flex-1">{@render children()}</div>
	</div>
	<div class="fixed bottom-5 left-1/2 -translate-x-1/2 transform">
		<Dock {active} />
	</div>
	<ToastContainer />
</div>
