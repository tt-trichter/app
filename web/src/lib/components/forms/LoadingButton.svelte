<script lang="ts">
	interface LoadingButtonProps {
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		variant?:
			| 'primary'
			| 'secondary'
			| 'accent'
			| 'neutral'
			| 'ghost'
			| 'link'
			| 'error'
			| 'warning'
			| 'success';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
		title?: string;
		onclick?: (e?: Event) => void;
		children: import('svelte').Snippet;
	}

	let {
		loading = false,
		disabled = false,
		type = 'button',
		variant = 'primary',
		size = 'md',
		class: customClass = '',
		title = '',
		onclick,
		children
	}: LoadingButtonProps = $props();

	const variantClass =
		variant === 'primary'
			? 'btn-primary'
			: variant === 'secondary'
				? 'btn-secondary'
				: variant === 'accent'
					? 'btn-accent'
					: variant === 'neutral'
						? 'btn-neutral'
						: variant === 'ghost'
							? 'btn-ghost'
							: variant === 'link'
								? 'btn-link'
								: variant === 'error'
									? 'btn-error'
									: variant === 'warning'
										? 'btn-warning'
										: variant === 'success'
											? 'btn-success'
											: '';

	const sizeClass =
		size === 'xs'
			? 'btn-xs'
			: size === 'sm'
				? 'btn-sm'
				: size === 'lg'
					? 'btn-lg'
					: size === 'xl'
						? 'btn-xl'
						: '';

	const isDisabled = disabled || loading;

	function handleClick(e: Event) {
		if (!isDisabled && onclick) {
			onclick(e);
		}
	}
</script>

<button
	{type}
	class="btn {variantClass} {sizeClass} {customClass}"
	disabled={isDisabled}
	{title}
	onclick={handleClick}
>
	{#if loading}
		<span class="loading loading-spinner loading-sm"></span>
	{/if}
	{@render children()}
</button>
