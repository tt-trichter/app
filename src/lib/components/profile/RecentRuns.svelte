<script lang="ts">
	import { Clock, Droplet, Gauge } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/date';
	import { getImageUrl } from '$lib/utils/image';

	interface Props {
		runs: Array<{
			id: string;
			image: string;
			data: {
				rate: number;
				volume: number;
				duration: number;
			};
			createdAt: Date;
		}>;
	}

	let { runs }: Props = $props();
</script>

{#if runs.length > 0}
	<div class="mt-4 mb-8">
		<h2 class="mb-4 flex items-center gap-2 text-2xl font-bold">
			<Clock size={24} />
			Recent Runs
		</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each runs as run (run.id)}
				<div class="card bg-base-100 shadow-sm">
					<figure class="px-4 pt-4">
						<img src={getImageUrl(run.image)} alt="" class="h-32 w-full rounded-lg object-cover" />
					</figure>
					<div class="card-body p-4">
						<div class="space-y-2">
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
						<div class="divider my-2"></div>
						<div class="text-base-content/70 text-center text-xs">
							{formatDate(run.createdAt)}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
