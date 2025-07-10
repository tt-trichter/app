<script lang="ts">
	import { enhance } from '$app/forms';
	import type { RunWithUser } from '$lib/models/run';
	import { formatDate } from '$lib/utils/date.js';
	import { getImageUrl } from '$lib/utils/image.js';

	let {
		run,
		isLoading = false
	}: {
		run: RunWithUser;
		isLoading?: boolean;
	} = $props();
</script>

<div class="card bg-base-100 m-4 w-xs shadow-sm">
	<figure>
		{#if isLoading}
			<div class="skeleton h-48 w-full"></div>
		{:else}
			<img src={getImageUrl(run.image)} alt="Run image {run.id}" />
		{/if}
	</figure>
	<div class="card-body">
		{#if isLoading}
			<div class="skeleton mb-2 h-6 w-3/4"></div>
		{:else}
			<h2 class="card-title">{run.data.volume.toFixed(2)}L in {run.data.duration.toFixed(2)}s!</h2>
		{/if}

		{#if isLoading}
			<div class="skeleton mb-4 h-4 w-full"></div>
		{:else}
			<p>{run.data.rate}L/min at {formatDate(run.createdAt)}</p>
		{/if}

		<div class="card-actions items-center justify-end">
			{#if isLoading}
				<div class="skeleton h-4 w-20"></div>
				<div class="skeleton h-8 w-20 rounded-md"></div>
			{:else}
				<p class="text-gray-500">By {run.user?.name ?? 'Unknown'}</p>
				{#if !run.user}
					<form action="?/claimRun" method="POST" use:enhance>
						<input type="hidden" name="id" value={run.id} />
						<button class="btn btn-success" type="submit">Claim Run</button>
					</form>
				{/if}
			{/if}
		</div>
	</div>
</div>
