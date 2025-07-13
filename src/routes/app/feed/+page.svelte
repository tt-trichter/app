<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { RunWithUser } from '$lib/models/run';
	import FeedItem from './FeedItem.svelte';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import { runsStore } from '$lib/stores/runs.svelte';
	import { useFormHandler } from '$lib/composables/useFormHandler.svelte';
	import { placeholderRuns } from '$lib/utils/placeholders';

	let { data, form: rawForm }: { data: PageData & { runs?: RunWithUser[] }; form: unknown } =
		$props();

	const { handleFormResult } = useFormHandler();

	let displayRuns = $derived(runsStore.isLoading ? placeholderRuns : runsStore.runsByTimestamp);

	onMount(async () => {
		await runsStore.initializeOrLoad(data.runs);
		handleFormResult(rawForm as Record<string, unknown> | null);
	});
</script>

<svelte:head>
	<title>Trichter - Feed</title>
</svelte:head>

{#if runsStore.error}
	<div class="flex min-h-screen items-center justify-center">
		<div class="alert alert-error max-w-md">
			<span>Error loading runs: {runsStore.error}</span>
			<button class="btn btn-sm" onclick={() => runsStore.loadRunsIfNeeded(true)}> Retry </button>
		</div>
	</div>
{:else}
	<div class="max-w-vw flex flex-col justify-center">
		<!-- Connection status indicator -->
		<div class="bg-base-100/80 border-base-300 sticky top-0 z-10 mb-4 border-b backdrop-blur-sm">
			<div class="flex justify-center py-2">
				<ConnectionStatus showText={true} />
			</div>
		</div>

		{#each displayRuns as run (run.id)}
			<FeedItem {run} isLoading={runsStore.isLoading} />
		{/each}
	</div>
{/if}
