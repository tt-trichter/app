<script lang="ts">
	import { Check, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import UserAutocomplete from './UserAutocomplete.svelte';
	import LoadingButton from './forms/LoadingButton.svelte';
	import { formatDate } from '$lib/utils/date';
	import { getImageUrl } from '$lib/utils/image';
	import type { RunWithUser } from '$lib/models/run';

	interface UserSelectHandler {
		(
			runId: string,
			user: { id: string; name: string; username: string; displayUsername: string }
		): void;
	}

	interface GetSelectedUserHandler {
		(runId: string): { id: string; name: string; username: string; displayUsername: string } | null;
	}

	interface CreateEnhancedSubmitHandler {
		(
			actionName: string,
			runId?: string
		):
			| ((options: {
					cancel: () => void;
			  }) =>
					| ((options: {
							result: import('@sveltejs/kit').ActionResult<Record<string, unknown>>;
							update: () => void;
					  }) => Promise<void>)
					| undefined)
			| undefined;
	}

	let {
		runs,
		isAdmin = false,
		isLoading = false,
		pendingDeletions = new Set(),
		onUserSelect,
		getSelectedUser,
		createEnhancedSubmit
	}: {
		runs: RunWithUser[];
		isAdmin?: boolean;
		isLoading?: boolean;
		pendingDeletions?: Set<string>;
		onUserSelect?: UserSelectHandler;
		getSelectedUser?: GetSelectedUserHandler;
		createEnhancedSubmit?: CreateEnhancedSubmitHandler;
	} = $props();
</script>

<div class="w-full">
	<!-- Mobile View -->
	<div class="block lg:hidden">
		<div class="space-y-4">
			{#if runs && runs.length > 0}
				{#each runs as run, i (run.id)}
					<div class="card bg-base-100 border-base-300 border shadow-sm">
						<div class="card-body p-4">
							<div class="mb-3 flex items-center justify-between">
								<div class="badge badge-primary badge-lg">#{i + 1}</div>
								{#if isAdmin}
									<form
										method="POST"
										action="?/deleteRun"
										use:enhance={createEnhancedSubmit?.('deleteRun', run.id)}
									>
										<input type="hidden" name="runId" value={run.id} />
										<LoadingButton
											type="submit"
											class="btn-ghost btn-sm text-error"
											title="Delete run"
											loading={pendingDeletions.has(run.id)}
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this run?')) {
													e?.preventDefault();
												}
											}}
										>
											<Trash2 size={16} />
										</LoadingButton>
									</form>
								{/if}
							</div>

							<div class="mb-3 flex items-center gap-3">
								{#if isLoading}
									<div class="skeleton h-12 w-12 rounded"></div>
									<div class="skeleton h-6 w-32"></div>
								{:else}
									<img
										class="h-12 w-12 rounded object-scale-down"
										src={getImageUrl(run.image)}
										alt="Image of run {i}"
									/>
									{#if run.user?.name}
										<a
											href="/app/profile/{run.user.username}"
											class="link link-primary hover:link-accent font-semibold no-underline"
										>
											{run.user.name}
										</a>
									{:else}
										<form
											class="flex w-full flex-col gap-2"
											method="POST"
											action="?/updateName"
											use:enhance
										>
											<input type="hidden" name="id" value={run.id} />
											<input
												type="hidden"
												name="user-id"
												value={getSelectedUser?.(run.id)?.id || ''}
											/>
											<div class="flex gap-2">
												<div class="flex-1">
													<UserAutocomplete
														placeholder="Search for user..."
														onSelect={(user) => onUserSelect?.(run.id, user)}
														required
													/>
												</div>
												<button
													class="btn btn-sm"
													type="submit"
													disabled={!getSelectedUser?.(run.id)?.id}
												>
													<Check size={16} />
												</button>
											</div>
										</form>
									{/if}
								{/if}
							</div>

							<div class="grid grid-cols-2 gap-3 text-sm">
								<div class="flex flex-col">
									<span class="text-base-content/60 text-xs">Time</span>
									{#if isLoading}
										<div class="skeleton h-4 w-16"></div>
									{:else}
										<span class="font-semibold">{run.data.duration}s</span>
									{/if}
								</div>
								<div class="flex flex-col">
									<span class="text-base-content/60 text-xs">Amount</span>
									{#if isLoading}
										<div class="skeleton h-4 w-20"></div>
									{:else}
										<span class="font-semibold">{run.data.volume.toFixed(2)}L</span>
									{/if}
								</div>
								<div class="flex flex-col">
									<span class="text-base-content/60 text-xs">Flow Rate</span>
									{#if isLoading}
										<div class="skeleton h-4 w-24"></div>
									{:else}
										<span class="font-semibold">{run.data.rate.toFixed(2)}L/min</span>
									{/if}
								</div>
								<div class="flex flex-col">
									<span class="text-base-content/60 text-xs">Date</span>
									{#if isLoading}
										<div class="skeleton h-4 w-20"></div>
									{:else}
										<span class="text-xs">{formatDate(run.createdAt)}</span>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Desktop View -->
	<div class="hidden lg:block">
		<div class="rounded-box border-base-content/5 bg-base-100 overflow-x-auto border">
			<table class="table">
				<!-- head -->
				<thead>
					<tr>
						<th></th>
						<th>Name</th>
						<th>Image</th>
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
					{#if runs && runs.length > 0}
						{#each runs as run, i (run.id)}
							<tr>
								<th>{i + 1}</th>
								{#if run.user?.name}
									{#if isLoading}
										<td><div class="skeleton h-4 w-24"></div></td>
									{:else}
										<td>
											<a
												href="/app/profile/{run.user.username}"
												class="link link-primary hover:link-accent no-underline"
											>
												{run.user.name}
											</a>
										</td>
									{/if}
								{:else}
									<td>
										{#if isLoading}
											<div class="skeleton h-8 w-48"></div>
										{:else}
											<form class="join" method="POST" action="?/updateName" use:enhance>
												<input type="hidden" name="id" value={run.id} />
												<input
													type="hidden"
													name="user-id"
													value={getSelectedUser?.(run.id)?.id || ''}
												/>
												<div class="join-item">
													<UserAutocomplete
														placeholder="Search for user..."
														onSelect={(user) => onUserSelect?.(run.id, user)}
														required
													/>
												</div>
												<button
													class="btn join-item"
													type="submit"
													disabled={!getSelectedUser?.(run.id)?.id}
												>
													<Check />
												</button>
											</form>
										{/if}
									</td>
								{/if}
								<td>
									{#if isLoading}
										<div class="skeleton h-10 w-10 rounded"></div>
									{:else}
										<img
											class="h-10 w-10 object-scale-down"
											src={getImageUrl(run.image)}
											alt="Image of run {i}"
										/>
									{/if}
								</td>
								<td>
									{#if isLoading}
										<div class="skeleton h-4 w-12"></div>
									{:else}
										{run.data.duration}s
									{/if}
								</td>
								<td>
									{#if isLoading}
										<div class="skeleton h-4 w-16"></div>
									{:else}
										{run.data.volume.toFixed(2)}L
									{/if}
								</td>
								<td>
									{#if isLoading}
										<div class="skeleton h-4 w-20"></div>
									{:else}
										{run.data.rate.toFixed(2)}L/min
									{/if}
								</td>
								<td>
									{#if isLoading}
										<div class="skeleton h-4 w-28"></div>
									{:else}
										<span class="text-sm text-gray-500">{formatDate(run.createdAt)}</span>
									{/if}
								</td>
								{#if isAdmin}
									<td>
										{#if isLoading}
											<div class="skeleton h-8 w-8 rounded"></div>
										{:else}
											<form
												method="POST"
												action="?/deleteRun"
												use:enhance={createEnhancedSubmit?.('deleteRun', run.id)}
											>
												<input type="hidden" name="runId" value={run.id} />
												<LoadingButton
													type="submit"
													class="btn-ghost btn-sm text-error"
													title="Delete run"
													loading={pendingDeletions.has(run.id)}
													onclick={(e) => {
														if (!confirm('Are you sure you want to delete this run?')) {
															e?.preventDefault();
														}
													}}
												>
													<Trash2 size={16} />
												</LoadingButton>
											</form>
										{/if}
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
