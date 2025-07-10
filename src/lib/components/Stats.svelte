<script lang="ts">
	import type { RunWithUser } from '$lib/models/run';

	interface Props {
		totalRuns: number;
		quickestRun: RunWithUser | null;
		isLoading: boolean;
	}

	let { totalRuns, quickestRun, isLoading }: Props = $props();
</script>

<div class="stats mx-auto w-full shadow">
	<div class="stat">
		<div class="stat-title">Total Runs</div>
		{#if isLoading}
			<div class="stat-value skeleton h-8 w-16"></div>
		{:else}
			<div class="stat-value">{totalRuns}</div>
		{/if}
	</div>

	<div class="stat">
		<div class="stat-title">Quickest Run</div>
		{#if isLoading}
			<div class="stat-value skeleton h-8 w-20"></div>
		{:else if quickestRun}
			<div class="stat-value">{quickestRun.data.duration}s</div>
			<div class="stat-desc">by {quickestRun.user?.name ?? 'Unknown'}</div>
		{:else}
			<div class="stat-value">--</div>
		{/if}
	</div>
</div>
