<script lang="ts">
	import { RefreshCw, X, Download } from 'lucide-svelte';
	import { pwaState, pwaManager } from '$lib/stores/pwa.svelte';

	let { show = $bindable(false) }: { show?: boolean } = $props();
	let isUpdating = $state(false);

	async function handleUpdate() {
		isUpdating = true;
		try {
			await pwaManager.updateApp();
			show = false;
		} catch (error) {
			console.error('Update failed:', error);
			isUpdating = false;
		}
	}

	function handleClose() {
		show = false;
		pwaManager.hideUpdatePrompt();
	}
</script>

{#if show && pwaState.needsUpdate}
	<div class="toast toast-top toast-end z-50 max-w-sm">
		<div class="alert alert-warning">
			<div class="flex items-start gap-3">
				<Download size={24} class="text-warning mt-1 flex-shrink-0" />
				<div class="flex-grow">
					<h3 class="text-base-content font-semibold">App Update Available</h3>
					<p class="text-base-content/90 mb-2 text-sm">A new version of Trichter is ready with:</p>
					<ul class="text-base-content/75 mb-3 space-y-1 text-xs">
						<li>🐛 Bug fixes and improvements</li>
						<li>⚡ Performance enhancements</li>
						<li>✨ New features</li>
					</ul>
					<div class="flex gap-2">
						<button class="btn btn-sm btn-warning" onclick={handleUpdate} disabled={isUpdating}>
							{#if isUpdating}
								<RefreshCw size={16} class="animate-spin" />
								Updating...
							{:else}
								<RefreshCw size={16} />
								Update Now
							{/if}
						</button>
						<button class="btn btn-sm btn-ghost" onclick={handleClose} disabled={isUpdating}>
							Later
						</button>
					</div>
				</div>
				{#if !isUpdating}
					<button class="btn btn-sm btn-circle btn-ghost" onclick={handleClose}>
						<X size={16} />
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
