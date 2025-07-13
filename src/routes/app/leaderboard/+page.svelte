<script lang="ts">
	import { onMount } from 'svelte';
	import { Role } from '$lib/models/roles';
	import type { PageData, ActionData } from './$types';
	import type { RunWithUser } from '$lib/models/run';
	import Stats from '$lib/components/Stats.svelte';
	import LeaderboardTable from '$lib/components/LeaderboardTable.svelte';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import { runsStore } from '$lib/stores/runs.svelte';
	import { useFormHandler } from '$lib/composables/useFormHandler.svelte';
	import { useUserSelection } from '$lib/composables/useUserSelection.svelte';
	import { createPlaceholderRuns } from '$lib/utils/placeholders';

	let { data, form }: { data: PageData & { runs?: RunWithUser[] }; form: ActionData } = $props();

	const { pendingDeletions, handleFormResult, createEnhancedSubmit } = useFormHandler();
	const { handleUserSelect, getSelectedUser } = useUserSelection();

	let isAdmin = $derived(data.user?.role === Role.Admin);

	let displayRuns = $derived(runsStore.isLoading ? createPlaceholderRuns(8) : runsStore.runsByRate);

	onMount(async () => {
		await runsStore.initializeOrLoad(data.runs);
		handleFormResult(form as Record<string, unknown> | null);
	});
</script>

<svelte:head>
	<title>Trichter - Leaderboard</title>
</svelte:head>

<div class="flex flex-col items-center">
	<div class="w-full space-y-6 py-4 sm:py-8">
		<div class="flex items-center justify-between">
			<h1 class="text-primary flex-grow text-center text-3xl font-bold sm:text-4xl">Leaderboard</h1>
			<div class="flex items-center gap-2">
				<ConnectionStatus showText={false} />
			</div>
		</div>

		{#if runsStore.error}
			<div class="alert alert-error">
				<span>Error loading runs: {runsStore.error}</span>
				<button class="btn btn-sm" onclick={() => runsStore.loadRunsIfNeeded(true)}> Retry </button>
			</div>
		{:else}
			<Stats
				totalRuns={runsStore.totalRuns}
				quickestRun={runsStore.quickestRun}
				isLoading={runsStore.isLoading}
			/>
		{/if}

		<div class="divider"></div>

		<LeaderboardTable
			runs={displayRuns}
			{isAdmin}
			isLoading={runsStore.isLoading}
			{pendingDeletions}
			onUserSelect={handleUserSelect}
			{getSelectedUser}
			{createEnhancedSubmit}
		/>
	</div>
</div>
