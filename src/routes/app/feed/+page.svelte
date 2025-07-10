<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { RunWithUser } from '$lib/models/run';
	import FeedItem from './FeedItem.svelte';
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

{#if runsStore.error}
	<div class="flex min-h-screen items-center justify-center">
		<div class="alert alert-error max-w-md">
			<span>Error loading runs: {runsStore.error}</span>
			<button class="btn btn-sm" onclick={() => runsStore.loadRunsIfNeeded(true)}> Retry </button>
		</div>
	</div>
{:else}
	<div class="max-w-vw flex flex-wrap justify-center">
		{#each displayRuns as run (run.id)}
			<FeedItem {run} isLoading={runsStore.isLoading} />
		{/each}
	</div>
{/if}
