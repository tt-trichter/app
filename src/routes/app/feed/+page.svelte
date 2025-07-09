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
	import { PUBLIC_MINIO_BASE_URL, PUBLIC_MINIO_PORT } from '$env/static/public';
	import FeedItem from './FeedItem.svelte';

	let { data, form: rawForm }: { data: PageData; form: ActionData } = $props();
	let form = $state(rawForm);

	let runs: RunWithUser[] = $state((data.runs || []).sort((a, b) => b.timestamp - a.timestamp));

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

<div class="max-w-vw flex flex-wrap justify-center">
	{#each runs as run (run.id)}
		<FeedItem {run} />
	{/each}
</div>
