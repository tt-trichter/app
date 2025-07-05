<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte.js';

	function showSuccessToast() {
		toast.success('Operation completed successfully!');
	}

	function showErrorToast() {
		toast.error('Something went wrong. Please try again.');
	}

	function showInfoToast() {
		toast.info('This is some useful information.');
	}

	function showWarningToast() {
		toast.warning('Please be careful with this action.');
	}

	function showLoadingToast() {
		const loadingId = toast.loading('Processing your request...');

		// Simulate async operation
		setTimeout(() => {
			toast.dismiss(loadingId);
			toast.success('Operation completed!');
		}, 3000);
	}

	function showMultipleToasts() {
		toast.info('First toast message');
		setTimeout(() => toast.warning('Second toast message'), 500);
		setTimeout(() => toast.success('Third toast message'), 1000);
	}

	function clearAllToasts() {
		toast.clear();
	}
</script>

<div class="card bg-base-100 p-6 shadow-xl">
	<h2 class="card-title mb-4">Toast System Demo</h2>
	<p class="text-base-content/70 mb-6">Test the different types of toast notifications:</p>

	<div class="grid grid-cols-2 gap-4">
		<button class="btn btn-success" onclick={showSuccessToast}> Success Toast </button>

		<button class="btn btn-error" onclick={showErrorToast}> Error Toast </button>

		<button class="btn btn-info" onclick={showInfoToast}> Info Toast </button>

		<button class="btn btn-warning" onclick={showWarningToast}> Warning Toast </button>

		<button class="btn btn-neutral" onclick={showLoadingToast}> Loading Toast </button>

		<button class="btn btn-secondary" onclick={showMultipleToasts}> Multiple Toasts </button>
	</div>

	<div class="divider"></div>

	<button class="btn btn-ghost btn-sm" onclick={clearAllToasts}> Clear All Toasts </button>
</div>
