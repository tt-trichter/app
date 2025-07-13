<script lang="ts">
	import { WifiOff, Wifi } from 'lucide-svelte';
	import { pwaState } from '$lib/stores/pwa.svelte';

	let { showWhenOnline = false }: { showWhenOnline?: boolean } = $props();
	let showOnlineMessage = $state(false);
	let wasOffline = $state(false);

	// Watch for state changes using $effect
	$effect(() => {
		if (wasOffline && !pwaState.isOffline) {
			// Just came back online
			showOnlineMessage = true;
			setTimeout(() => {
				showOnlineMessage = false;
			}, 3000); // Hide after 3 seconds
		}
		wasOffline = pwaState.isOffline;
	});
</script>

{#if pwaState.isOffline || (showWhenOnline && showOnlineMessage)}
	<div class="toast toast-bottom toast-center z-40">
		<div class="alert {pwaState.isOffline ? 'alert-error' : 'alert-success'}">
			<div class="flex items-center gap-2">
				{#if pwaState.isOffline}
					<WifiOff size={20} class="text-error-content" />
					<span class="text-error-content">You're offline. Some features may be limited.</span>
				{:else}
					<Wifi size={20} class="text-success-content" />
					<span class="text-success-content">You're back online!</span>
				{/if}
			</div>
		</div>
	</div>
{/if}
