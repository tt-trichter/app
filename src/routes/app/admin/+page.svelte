<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Role } from '$lib/models/roles';
	import type { PageData, ActionData } from './$types';
	import { Plus, Edit, Trash2, Search, Check, X } from 'lucide-svelte';
	import { toast } from '$lib/stores/toast.svelte.js';

	let { data, form: rawForm }: { data: PageData; form: ActionData } = $props();
	let form = $state(rawForm);

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedUser: any = $state(null);
	let searchTerm = $state('');

	let filteredUsers = $derived(
		data.users.filter(
			(user) =>
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				((user as any).username &&
					(user as any).username.toLowerCase().includes(searchTerm.toLowerCase()))
		)
	);

	function openCreateModal() {
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	function openEditModal(user: any) {
		selectedUser = { ...user };
		if (selectedUser.banExpires) {
			selectedUser.banExpires = new Date(selectedUser.banExpires).toISOString().split('T')[0];
		}
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedUser = null;
	}

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('de-EN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getRoleBadgeClass(role: string | null | undefined) {
		return role === Role.Admin ? 'badge-error' : 'badge-primary';
	}

	function getStatusBadgeClass(banned: boolean | null | undefined) {
		return banned ? 'badge-warning' : 'badge-success';
	}

	let lastFormResult: any = $state(null);

	let pendingSubmissions = $state(new Set<string>());

	$effect(() => {
		if (form && form !== lastFormResult && (form.success || form.error)) {
			const currentForm = form;
			lastFormResult = currentForm;

			if (currentForm.success) {
				toast.success(currentForm.message || 'Operation completed successfully');
				showCreateModal = false;
				showEditModal = false;
				selectedUser = null;
			} else if (currentForm.error) {
				toast.error(currentForm.error);
			}
		}
	});

	function createEnhancedSubmit(actionName: string) {
		return ({ formData, cancel }: { formData: FormData; cancel: () => void }) => {
			const submissionKey = `${actionName}-${formData.get('userId') || 'new'}`;

			if (pendingSubmissions.has(submissionKey)) {
				cancel();
				return;
			}

			pendingSubmissions.add(submissionKey);

			let loadingToastId: string;
			switch (actionName) {
				case 'createUser':
					loadingToastId = toast.loading('Creating user...');
					break;
				case 'updateUser':
					loadingToastId = toast.loading('Updating user...');
					break;
				case 'deleteUser':
					loadingToastId = toast.loading('Deleting user...');
					break;
				case 'toggleEmailVerification':
					loadingToastId = toast.loading('Updating email verification...');
					break;
				default:
					loadingToastId = toast.loading('Processing...');
			}

			return async ({ result, update }: { result: any; update: () => void }) => {
				pendingSubmissions.delete(submissionKey);

				if (loadingToastId) {
					toast.dismiss(loadingToastId);
				}

				if (result.type === 'success' && result.data) {
					const resultData = { ...result.data };
					lastFormResult = resultData;

					if (resultData.success) {
						toast.success(resultData.message || 'Operation completed successfully');
						showCreateModal = false;
						showEditModal = false;
						selectedUser = null;
					} else if (resultData.error) {
						toast.error(resultData.error);
					}
				}

				await update();
			};
		};
	}
</script>

<div class="container mx-auto p-6">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h1 class="text-3xl font-bold">Admin Panel</h1>
				<p class="text-base-content/70">Manage users and their permissions</p>
			</div>
			<button class="btn btn-primary gap-2" onclick={() => openCreateModal()}>
				<Plus size={20} />
				Create User
			</button>
		</div>

		<!-- Search -->
		<div class="flex flex-col gap-4 sm:flex-row">
			<div class="form-control flex-1">
				<div class="input-group">
					<input
						type="text"
						placeholder="Search users..."
						class="input input-bordered flex-1"
						bind:value={searchTerm}
					/>
				</div>
			</div>
		</div>

		<!-- Users Table -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Users ({filteredUsers.length})</h2>
				<div class="overflow-x-auto">
					<table class="table-zebra table">
						<thead>
							<tr>
								<th>User</th>
								<th>Email</th>
								<th>Username</th>
								<th>Role</th>
								<th>Status</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredUsers as user (user.id)}
								<tr>
									<td>
										<div class="flex items-center gap-3">
											<div class="avatar placeholder">
												<div
													class="bg-neutral text-neutral-content flex w-12 items-center justify-center rounded-full"
												>
													{#if user.image}
														<img
															src={user.image}
															alt={user.name.charAt(0).toUpperCase()}
															class="rounded-full"
														/>
													{:else}
														<div class="flex h-full w-full items-center justify-center">
															<p class="text-center text-lg">
																{user.name.charAt(0).toUpperCase()}
															</p>
														</div>
													{/if}
												</div>
											</div>
											<div>
												<div class="font-bold">{user.name}</div>
												<div class="text-sm opacity-50">ID: {user.id.slice(0, 8)}...</div>
											</div>
										</div>
									</td>
									<td>
										<span class="font-mono text-sm">{user.email}</span>
										{#if user.emailVerified}
											<div class="badge badge-success badge-sm mt-1">Verified</div>
										{:else}
											<div class="badge badge-warning badge-sm mt-1">Unverified</div>
										{/if}
									</td>
									<td>
										<div class="font-mono">{(user as any).username || 'N/A'}</div>
									</td>
									<td>
										<div class="badge {getRoleBadgeClass(user.role)}">
											{user.role?.toUpperCase() || 'USER'}
										</div>
									</td>
									<td>
										<div class="flex flex-col gap-1">
											<div class="badge {getStatusBadgeClass(user.banned)}">
												{user.banned ? 'Banned' : 'Active'}
											</div>
											{#if user.banned && user.banExpires}
												<div class="text-xs opacity-50">
													Until {formatDate(user.banExpires)}
												</div>
											{/if}
										</div>
									</td>
									<td class="text-sm">{formatDate(user.createdAt)}</td>
									<td>
										<div class="flex gap-2">
											<form
												method="POST"
												action="?/toggleEmailVerification"
												use:enhance={createEnhancedSubmit('toggleEmailVerification')}
											>
												<input type="hidden" name="userId" value={user.id} />
												<input type="hidden" name="emailVerified" value={!user.emailVerified} />
												<button
													type="submit"
													class="btn btn-ghost btn-sm {user.emailVerified
														? 'text-warning'
														: 'text-success'}"
													title={user.emailVerified ? 'Mark as unverified' : 'Mark as verified'}
													disabled={pendingSubmissions.has(`toggleEmailVerification-${user.id}`)}
												>
													{#if pendingSubmissions.has(`toggleEmailVerification-${user.id}`)}
														<span class="loading loading-spinner loading-xs"></span>
													{:else if user.emailVerified}
														<X size={16} />
													{:else}
														<Check size={16} />
													{/if}
												</button>
											</form>
											<button
												class="btn btn-ghost btn-sm"
												onclick={() => openEditModal(user)}
												title="Edit user"
											>
												<Edit size={16} />
											</button>
											<form
												method="POST"
												action="?/deleteUser"
												use:enhance={createEnhancedSubmit('deleteUser')}
											>
												<input type="hidden" name="userId" value={user.id} />
												<button
													type="submit"
													class="btn btn-ghost btn-sm text-error"
													title="Delete user"
													disabled={pendingSubmissions.has(`deleteUser-${user.id}`)}
													onclick={(e) => {
														if (!confirm('Are you sure you want to delete this user?')) {
															e.preventDefault();
														}
													}}
												>
													{#if pendingSubmissions.has(`deleteUser-${user.id}`)}
														<span class="loading loading-spinner loading-xs"></span>
													{:else}
														<Trash2 size={16} />
													{/if}
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if filteredUsers.length === 0}
						<div class="text-base-content/50 py-8 text-center">
							{searchTerm ? 'No users found matching your search' : 'No users found'}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Create User Modal -->
<dialog class="modal" class:modal-open={showCreateModal}>
	<div class="modal-box w-11/12 max-w-2xl">
		<form method="dialog">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
				onclick={closeCreateModal}>✕</button
			>
		</form>
		<h3 class="mb-4 text-lg font-bold">Create New User</h3>

		<form
			method="POST"
			action="?/createUser"
			use:enhance={createEnhancedSubmit('createUser')}
			class="space-y-4"
		>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="form-control">
					<label class="label" for="create-name">
						<span class="label-text">Full Name</span>
					</label>
					<input
						id="create-name"
						name="name"
						type="text"
						placeholder="John Doe"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="create-email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="create-email"
						name="email"
						type="email"
						placeholder="john@example.com"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="create-username">
						<span class="label-text">Username</span>
					</label>
					<input
						id="create-username"
						name="username"
						type="text"
						placeholder="johndoe"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="create-role">
						<span class="label-text">Role</span>
					</label>
					<select id="create-role" name="role" class="select select-bordered" required>
						<option value="user">User</option>
						<option value="admin">Admin</option>
					</select>
				</div>

				<div class="form-control">
					<label class="label" for="create-password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="create-password"
						name="password"
						type="password"
						placeholder="••••••••"
						class="input input-bordered"
						required
					/>
				</div>
				<div class="modal-action">
					<button type="button" class="btn" onclick={closeCreateModal}>Cancel</button>
					<button type="submit" class="btn btn-primary">Create User</button>
				</div>
			</div>
		</form>
	</div>
</dialog>

<!-- Edit User Modal -->
<dialog class="modal" class:modal-open={showEditModal}>
	<div class="modal-box w-11/12 max-w-2xl">
		<form method="dialog">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
				onclick={closeEditModal}>✕</button
			>
		</form>
		<h3 class="mb-4 text-lg font-bold">Edit User</h3>

		{#if selectedUser}
			<form
				method="POST"
				action="?/updateUser"
				use:enhance={createEnhancedSubmit('updateUser')}
				class="space-y-4"
			>
				<input type="hidden" name="id" value={selectedUser.id} />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label" for="edit-name">
							<span class="label-text">Full Name</span>
						</label>
						<input
							id="edit-name"
							name="name"
							type="text"
							bind:value={selectedUser.name}
							class="input input-bordered"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="edit-email">
							<span class="label-text">Email</span>
						</label>
						<input
							id="edit-email"
							name="email"
							type="email"
							bind:value={selectedUser.email}
							class="input input-bordered"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="edit-username">
							<span class="label-text">Username</span>
						</label>
						<input
							id="edit-username"
							name="username"
							type="text"
							bind:value={selectedUser.username}
							class="input input-bordered"
							required
						/>
						<div class="label">
							<span class="label-text-alt">Username normalization is handled by better-auth</span>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="edit-role">
							<span class="label-text">Role</span>
						</label>
						<select
							id="edit-role"
							name="role"
							bind:value={selectedUser.role}
							class="select select-bordered"
							required
						>
							<option value="user">User</option>
							<option value="admin">Admin</option>
						</select>
					</div>

					<div class="form-control md:col-span-2">
						<label class="label cursor-pointer">
							<span class="label-text">Banned</span>
							<input
								type="checkbox"
								name="banned"
								bind:checked={selectedUser.banned}
								class="toggle toggle-error"
							/>
						</label>
					</div>

					{#if selectedUser.banned}
						<div class="form-control md:col-span-2">
							<label class="label" for="edit-ban-reason">
								<span class="label-text">Ban Reason</span>
							</label>
							<input
								id="edit-ban-reason"
								name="banReason"
								type="text"
								bind:value={selectedUser.banReason}
								placeholder="Reason for ban"
								class="input input-bordered"
							/>
						</div>

						<div class="form-control md:col-span-2">
							<label class="label" for="edit-ban-expires">
								<span class="label-text">Ban Expires (optional)</span>
							</label>
							<input
								id="edit-ban-expires"
								name="banExpires"
								type="date"
								bind:value={selectedUser.banExpires}
								class="input input-bordered"
							/>
						</div>
					{/if}
				</div>

				<div class="modal-action">
					<button type="button" class="btn" onclick={closeEditModal}>Cancel</button>
					<button type="submit" class="btn btn-primary">Update User</button>
				</div>
			</form>
		{/if}
	</div>
</dialog>
