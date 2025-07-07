<script lang="ts">
	import { Check, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { source } from 'sveltekit-sse';
	import type { RunWithUser } from '$lib/models/run';
	import { ServerEvent } from '$lib/models/events';
	import { Role } from '$lib/models/roles';
	import type { PageData, ActionData } from './$types';
	import UserAutocomplete from '$lib/components/UserAutocomplete.svelte';
	import { toast } from '$lib/stores/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let runs: RunWithUser[] = $state((data.runs || []).sort((a, b) => b.data.rate - a.data.rate));
	let totalRuns = $derived(runs.length);
	let quickest = $derived.by(() => {
		return runs.length
			? runs.reduce((max, curr) => (curr.data.rate > max.data.rate ? curr : max))
			: null;
	});

	let isAdmin = $derived(data.user?.role === Role.Admin);

	let selectedUsers: Record<
		string,
		{ id: string; name: string; username: string; displayUsername: string } | null
	> = $state({});

	let pendingDeletions = $state(new Set<string>());

	let lastFormResult: ActionData | null = $state(null);

	$effect(() => {
		if (form && form !== lastFormResult) {
			lastFormResult = form;

			if (form.success) {
				toast.success(form.message || 'Operation completed successfully');
			} else if (form.error) {
				toast.error(form.error);
			}
		}
	});

	async function setupServerSideEvents() {
		source('/api/v1/runs/sse')
			.select(ServerEvent.RunCreated)
			.json()
			.subscribe((value: RunWithUser) => {
				if (!value) return;
				// Insert new run and maintain sort order by rate
				runs = [...runs, value].sort((a, b) => b.data.rate - a.data.rate);
				// Show toast notification for new run
				toast.success(
					`New run by ${value.user?.name || 'Unknown'}: ${value.data.rate.toFixed(2)} L/min!`
				);
			});

		source('/api/v1/runs/sse')
			.select(ServerEvent.RunUpdated)
			.json()
			.subscribe((value: RunWithUser) => {
				if (!value) return;
				// Update run and maintain sort order by rate
				runs = runs
					.map((r) => (r.id === value.id ? value : r))
					.sort((a, b) => b.data.rate - a.data.rate);
				// Show toast notification for updated run
				toast.info(
					`Run updated: ${value.user?.name || 'Unknown'} - ${value.data.rate.toFixed(2)} L/min`
				);
			});

		source('/api/v1/runs/sse')
			.select(ServerEvent.RunDeleted)
			.json()
			.subscribe((value: { id: string }) => {
				if (!value?.id) return;
				// Remove run from list
				runs = runs.filter((r) => r.id !== value.id);
				// Show toast notification for deleted run
				toast.warning('Run deleted');
			});
	}

	function handleUserSelect(
		runId: string,
		user: { id: string; name: string; username: string; displayUsername: string }
	) {
		selectedUsers[runId] = user;
	}

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function createEnhancedSubmit(actionName: string, runId?: string) {
		return ({ cancel }: { formData: FormData; cancel: () => void }) => {
			if (actionName === 'deleteRun' && runId) {
				if (pendingDeletions.has(runId)) {
					cancel();
					return;
				}
				pendingDeletions.add(runId);
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return async ({ result, update }: { result: any; update: () => void }) => {
				if (actionName === 'deleteRun' && runId) {
					pendingDeletions.delete(runId);
				}

				if (result.type === 'success' && result.data) {
					lastFormResult = result.data;

					if (result.data.success) {
						toast.success(result.data.message || 'Operation completed successfully');
					} else if (result.data.error) {
						toast.error(result.data.error);
					}
				}

				await update();
			};
		};
	}

	onMount(() => {
		setupServerSideEvents();
	});
</script>

<div class="flex w-full flex-col items-center justify-between align-middle">
	<div class="mt-10 flex flex-col gap-1">
		<h1 class="text-primary text-center text-4xl font-bold">Leaderbord</h1>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-primary"></div>
				<div class="stat-title">Total Trichters</div>
				<div class="stat-value text-secondary">{totalRuns}</div>
			</div>

			{#if quickest}
				<div class="stat">
					<div class="stat-figure text-secondary"></div>
					<div class="stat-value">{quickest.data.rate.toFixed(0)} L/min</div>
					<div class="stat-title">That's a lot of beer!</div>
					<div class="stat-desc text-secondary">
						{quickest.user?.name ?? 'Unknown'} drinks really fast!
					</div>
				</div>
			{/if}
		</div>
		<div class="divider"></div>

		<div class="rounded-box border-base-content/5 bg-base-100 overflow-x-auto border">
			<table class="table">
				<!-- head -->
				<thead>
					<tr>
						<th></th>
						<th>Name</th>
						<th>Time</th>
						<th>Amount</th>
						<th>Flow Rate</th>
						<th>Timestamp</th>
						{#if isAdmin}
							<th>Actions</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#if runs}
						{#each runs as run, i (run.id)}
							<tr>
								<th>{i + 1}</th>
								{#if run.user?.name}
									<td>{run.user.name}</td>
								{:else}
									<td>
										<form class="join" method="POST" action="?/updateName" use:enhance>
											<input type="hidden" name="id" value={run.id} />
											<input type="hidden" name="user-id" value={selectedUsers[run.id]?.id || ''} />
											<div class="join-item">
												<UserAutocomplete
													placeholder="Search for user..."
													onSelect={(user) => handleUserSelect(run.id, user)}
													required
												/>
											</div>
											<button
												class="btn join-item"
												type="submit"
												disabled={!selectedUsers[run.id]?.id}
											>
												<Check />
											</button>
										</form>
									</td>
								{/if}
								<td>{run.data.duration}s</td>
								<td>{run.data.volume.toFixed(2)}L</td>
								<td>{run.data.rate.toFixed(2)}L/min</td>
								<td class="text-sm text-gray-500">{formatDate(run.createdAt)}</td>
								{#if isAdmin}
									<td>
										<form
											method="POST"
											action="?/deleteRun"
											use:enhance={createEnhancedSubmit('deleteRun', run.id)}
										>
											<input type="hidden" name="runId" value={run.id} />
											<button
												type="submit"
												class="btn btn-ghost btn-sm text-error"
												title="Delete run"
												disabled={pendingDeletions.has(run.id)}
												onclick={(e) => {
													if (!confirm('Are you sure you want to delete this run?')) {
														e.preventDefault();
													}
												}}
											>
												{#if pendingDeletions.has(run.id)}
													<span class="loading loading-spinner loading-xs"></span>
												{:else}
													<Trash2 size={16} />
												{/if}
											</button>
										</form>
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
