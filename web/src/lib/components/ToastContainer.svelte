<script lang="ts">
	import { toastStore, type Toast } from '$lib/stores/toast.svelte.js';
	import { X, CheckCircle, XCircle, Info, AlertTriangle, Loader2 } from 'lucide-svelte';

	function getToastClass(type: Toast['type']): string {
		switch (type) {
			case 'success':
				return 'alert-success';
			case 'error':
				return 'alert-error';
			case 'info':
				return 'alert-info';
			case 'warning':
				return 'alert-warning';
			case 'loading':
				return 'alert-info';
			default:
				return 'alert-info';
		}
	}

	function getToastIcon(type: Toast['type']) {
		switch (type) {
			case 'success':
				return CheckCircle;
			case 'error':
				return XCircle;
			case 'info':
				return Info;
			case 'warning':
				return AlertTriangle;
			case 'loading':
				return Loader2;
			default:
				return Info;
		}
	}

	function dismissToast(id: string) {
		toastStore.remove(id);
	}
</script>

{#if toastStore.toasts.length > 0}
	<div class="toast toast-top toast-end z-50">
		{#each toastStore.toasts as toast (toast.id)}
			<div class="alert {getToastClass(toast.type)} max-w-md min-w-80 shadow-lg">
				<div class="flex flex-1 items-center gap-3">
					{#if toast.type === 'loading'}
						<Loader2 size={20} class="animate-spin" />
					{:else}
						{@const IconComponent = getToastIcon(toast.type)}
						<IconComponent size={20} />
					{/if}
					<span class="text-sm">{toast.message}</span>
				</div>

				{#if toast.dismissible}
					<button
						class="btn btn-ghost btn-sm btn-circle"
						onclick={() => dismissToast(toast.id)}
						aria-label="Dismiss toast"
					>
						<X size={16} />
					</button>
				{/if}
			</div>
		{/each}
	</div>
{/if}
