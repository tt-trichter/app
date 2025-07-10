<script lang="ts">
	import { page } from '$app/state';
	import { logger } from '$lib/logger';

	// Log the error for debugging
	$effect(() => {
		if (page.error) {
			logger.error('Error page displayed:', page.error);
		}
	});
</script>

<div class="flex h-screen w-full flex-col items-center justify-center gap-4">
	<div class="text-center">
		{#if page.error}
			{#if page.error.code}
				<h1 class="text-error mb-2 text-6xl font-bold">{page.error.code}</h1>
				<h2 class="text-error mb-4 text-2xl">{page.error.message}</h2>
			{:else}
				<h2 class="text-error mb-4 text-3xl font-bold">{page.error.message}</h2>
			{/if}
		{:else}
			<h1 class="text-error mb-4 text-4xl font-bold">Unexpected Error</h1>
			<p class="text-base-content/70">Something went wrong. Please try again.</p>
		{/if}
	</div>

	<div class="flex gap-3">
		<button class="btn btn-primary" onclick={() => window.history.back()}> Go Back </button>
		<a href="/app" class="btn btn-outline"> Home </a>
	</div>
</div>
