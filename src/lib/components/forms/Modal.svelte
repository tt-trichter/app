<script lang="ts">
	interface ModalProps {
		isOpen: boolean;
		title: string;
		onClose: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'large';
		children: import('svelte').Snippet;
	}

	let { isOpen = false, title, onClose, size = 'md', children }: ModalProps = $props();

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl',
		large: 'max-w-4xl' // alias for lg
	};

	function handleClose() {
		onClose();
	}
</script>

<dialog class="modal" class:modal-open={isOpen}>
	<div class="modal-box w-11/12 {sizeClasses[size]}">
		<form method="dialog">
			<button
				type="button"
				class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
				onclick={handleClose}
			>
				✕
			</button>
		</form>

		<h3 class="mb-4 text-lg font-bold">{title}</h3>

		{@render children()}
	</div>

	<!-- Backdrop - clicking it closes the modal -->
	<form method="dialog" class="modal-backdrop">
		<button type="button" onclick={handleClose}>close</button>
	</form>
</dialog>
