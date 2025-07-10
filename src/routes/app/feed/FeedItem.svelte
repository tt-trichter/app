<script lang="ts">
	import { enhance } from '$app/forms';
	import type { RunWithUser } from '$lib/models/run';
	import { formatDate } from '$lib/utils/date.js';
	import { getImageUrl } from '$lib/utils/image.js';
	import { Clock, Droplet, Gauge } from 'lucide-svelte';

	let {
		run,
		isLoading = false
	}: {
		run: RunWithUser;
		isLoading?: boolean;
	} = $props();
</script>

{#if isLoading}
	<div class="card bg-base-100 min-h-sm my-3 min-w-2xs shadow-sm">
		<div class="flex h-full w-full justify-center py-5">
			<div class="loading loading-spinner loading-lg"></div>
		</div>
	</div>
{:else}
	<div class="card bg-base-100 m-4 mx-auto w-9/10 max-w-md shadow-sm">
		<figure>
			<img src={getImageUrl(run.image)} alt="Run image {run.id}" />
		</figure>
		<div class="card-body p-4">
			<div class="flex items-center justify-between">
				<div class="text-primary flex items-center gap-1">
					<Gauge size={14} />
					<span class="text-sm font-medium">Rate</span>
				</div>
				<span class="font-mono text-sm">{run.data.rate.toFixed(2)} L/min</span>
			</div>
			<div class="flex items-center justify-between">
				<div class="text-secondary flex items-center gap-1">
					<Droplet size={14} />
					<span class="text-sm font-medium">Volume</span>
				</div>
				<span class="font-mono text-sm">{run.data.volume.toFixed(2)} L</span>
			</div>
			<div class="flex items-center justify-between">
				<div class="text-accent flex items-center gap-1">
					<Clock size={14} />
					<span class="text-sm font-medium">Duration</span>
				</div>
				<span class="font-mono text-sm">{run.data.duration.toFixed(2)} sec</span>
			</div>
		</div>
		<div class="divider mt-0 mb-1"></div>
		<div class="text-base-content/70 flex justify-between px-4 pb-3 text-center text-xs">
			{#if run.user}
				<a class="text-primary" href="/app/profile/{run.user.username}"
					>{run.user.name || run.user.username}</a
				>
			{:else}
				<form action="?/claimRun" method="POST" use:enhance>
					<input type="hidden" name="id" value={run.id} />
					<button class="link text-info">Claim run</button>
				</form>
			{/if}

			<span>{formatDate(run.createdAt)}</span>
		</div>
	</div>
{/if}
