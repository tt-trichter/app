<script lang="ts">
	import { enhance } from '$app/forms';
	import { PUBLIC_MINIO_BASE_URL, PUBLIC_MINIO_PORT } from '$env/static/public';
	import type { RunWithUser } from '$lib/models/run';

	const imageBaseUrl = `http://${PUBLIC_MINIO_BASE_URL}:${PUBLIC_MINIO_PORT}`;

	let {
		run
	}: {
		run: RunWithUser;
	} = $props();

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="card bg-base-100 m-4 w-xs shadow-sm">
	<figure>
		<img src="{imageBaseUrl}/{run.image}" alt="Shoes" />
	</figure>
	<div class="card-body">
		<h2 class="card-title">{run.data.volume}L in {run.data.duration}s!</h2>
		<p>{run.data.rate}L/min at {formatDate(run.createdAt)}</p>
		<div class="card-actions items-center justify-end">
			<p class="text-gray-500">By {run.user?.name ?? 'Unkown'}</p>
			{#if !run.user}
				<form action="?/claimRun" method="POST" use:enhance>
					<input type="hidden" name="id" value={run.id} />
					<button class="btn btn-success" type="submit">Claim Run</button>
				</form>
			{/if}
		</div>
	</div>
</div>
