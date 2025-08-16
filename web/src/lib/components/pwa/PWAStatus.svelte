<script lang="ts">
	import { pwaState, pwaManager } from '$lib/stores/pwa.svelte';
	import { RefreshCw, Wifi, WifiOff, CheckCircle, Monitor } from 'lucide-svelte';

	async function handleUpdate() {
		await pwaManager.updateApp();
	}
</script>

<div class="card bg-base-100 shadow-lg">
	<div class="card-body">
		<h2 class="card-title">
			<Monitor size={24} />
			PWA Status
		</h2>

		<!-- Status Overview -->
		<div class="space-y-4">
			<!-- Update Status -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					{#if pwaState.needsUpdate}
						<RefreshCw size={20} class="text-warning" />
						<span>Update Available</span>
					{:else}
						<CheckCircle size={20} class="text-success" />
						<span>Up to Date</span>
					{/if}
				</div>
				{#if pwaState.needsUpdate}
					<button class="btn btn-sm btn-warning" onclick={handleUpdate}>
						<RefreshCw size={16} />
						Update
					</button>
				{/if}
			</div>

			<!-- Connection Status -->
			<div class="flex items-center gap-2">
				{#if pwaState.isOffline}
					<WifiOff size={20} class="text-error" />
					<span>Offline Mode</span>
				{:else}
					<Wifi size={20} class="text-success" />
					<span>Online</span>
				{/if}
			</div>

			<!-- PWA Features -->
			<div class="divider"></div>
			<div>
				<h4 class="mb-2 font-semibold">PWA Features</h4>
				<ul class="space-y-1 text-sm opacity-75">
					<li>⚡ Fast loading and smooth performance</li>
					<li>📡 Offline functionality</li>
					<li>🔄 Automatic updates</li>
					<li>🔔 Push notifications (when available)</li>
					<li>💾 Local data caching</li>
					<li>🌐 Browser-native installation</li>
				</ul>
			</div>
		</div>
	</div>
</div>
