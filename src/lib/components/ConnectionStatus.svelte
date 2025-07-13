<script lang="ts">
	import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-svelte';
	import { runsStore, type ConnectionState } from '$lib/stores/runs.svelte';

	let { showText = false }: { showText?: boolean } = $props();

	function getStatusColor(state: ConnectionState): string {
		switch (state) {
			case 'connected':
				return 'text-success';
			case 'connecting':
				return 'text-warning';
			case 'error':
				return 'text-error';
			case 'disconnected':
				return 'text-base-content/50';
			default:
				return 'text-base-content/50';
		}
	}

	function getStatusIcon(state: ConnectionState) {
		switch (state) {
			case 'connected':
				return Wifi;
			case 'connecting':
				return RotateCcw;
			case 'error':
				return AlertCircle;
			case 'disconnected':
				return WifiOff;
			default:
				return WifiOff;
		}
	}

	function getStatusText(state: ConnectionState): string {
		switch (state) {
			case 'connected':
				return 'Live Updates Active';
			case 'connecting':
				return 'Connecting...';
			case 'error':
				return !navigator.onLine ? 'No Internet Connection' : 'Connection Lost';
			case 'disconnected':
				return 'Disconnected';
			default:
				return 'Unknown';
		}
	}

	function handleReconnect() {
		if (runsStore.connectionState === 'error' || runsStore.connectionState === 'disconnected') {
			runsStore.reconnect();
		}
	}

	// Show more helpful tooltips
	function getTooltipText(state: ConnectionState): string {
		switch (state) {
			case 'connected':
				return 'Real-time updates are working. New runs and changes will appear automatically.';
			case 'connecting':
				return 'Establishing connection for real-time updates...';
			case 'error':
				return !navigator.onLine
					? 'No internet connection. Updates will resume when connection is restored.'
					: 'Connection lost. Click to retry or refresh the page.';
			case 'disconnected':
				return 'Real-time updates are disabled. Click to reconnect.';
			default:
				return '';
		}
	}
</script>

<div class="flex items-center gap-2" title={getTooltipText(runsStore.connectionState)}>
	{#if runsStore.connectionState}
		{@const IconComponent = getStatusIcon(runsStore.connectionState)}
		<IconComponent
			size={16}
			class="{getStatusColor(runsStore.connectionState)} {runsStore.connectionState === 'connecting'
				? 'animate-spin'
				: ''}"
		/>
	{/if}

	{#if showText}
		<span class="text-sm {getStatusColor(runsStore.connectionState)}">
			{getStatusText(runsStore.connectionState)}
		</span>
	{/if}

	{#if runsStore.connectionState === 'error' || runsStore.connectionState === 'disconnected'}
		<button
			class="btn btn-ghost btn-xs"
			onclick={handleReconnect}
			title="Reconnect to enable live updates"
		>
			<RotateCcw size={12} />
		</button>
	{/if}
</div>
