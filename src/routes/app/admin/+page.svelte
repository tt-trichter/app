<script lang="ts">
	import { enhance } from '$app/forms';
	import { Role } from '$lib/models/roles';
	import type { PageData, ActionData } from './$types';
	import type { ActionResult } from '@sveltejs/kit';
	import { Plus, Edit, Trash2, Check, X } from 'lucide-svelte';
	import { toast } from '$lib/stores/toast.svelte.js';
	import type { User } from '$lib/models/user';
	import Modal from '$lib/components/forms/Modal.svelte';
	import FormField from '$lib/components/forms/FormField.svelte';
	import LoadingButton from '$lib/components/forms/LoadingButton.svelte';

	let { data, form: rawForm }: { data: PageData; form: ActionData } = $props();
	let form = $state(rawForm);

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	interface EditableUser {
		id: string;
		name: string;
		email: string;
		username: string;
		displayUsername: string;
		role: string | null;
		banned: boolean | null;
		banReason: string;
		banExpires: string; // Always a string for form inputs
	}

	let selectedUser: EditableUser | null = $state(null);
	let searchTerm = $state('');

	// Remove unused createUserData since we're using form fields directly

	const roleOptions = [
		{ value: 'user', label: 'User' },
		{ value: 'admin', label: 'Admin' }
	];

	let filteredUsers = $derived(
		data.users.filter(
			(user) =>
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				((user as User).username &&
					(user as User).username.toLowerCase().includes(searchTerm.toLowerCase()))
		)
	);

	function openCreateModal() {
		// Reset is handled by form elements themselves
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	function openEditModal(user: PageData['users'][number]) {
		selectedUser = {
			id: user.id,
			name: user.name,
			email: user.email,
			username: ('username' in user ? user.username : '') || '',
			displayUsername:
				('displayUsername' in user ? user.displayUsername : '') ||
				('username' in user ? user.username : '') ||
				'',
			role: ('role' in user ? user.role : null) || null,
			banned: ('banned' in user ? user.banned : null) || null,
			banReason: ('banReason' in user ? user.banReason : '') || '',
			banExpires:
				'banExpires' in user && user.banExpires
					? user.banExpires instanceof Date
						? user.banExpires.toISOString().split('T')[0]
						: new Date(user.banExpires).toISOString().split('T')[0]
					: ''
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedUser = null;
	}

	/**
	 * Format date with proper localization
	 */
	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * Get CSS class for role badge based on role value
	 */
	function getRoleBadgeClass(role: string | null | undefined): string {
		return role === Role.Admin ? 'badge-error' : 'badge-primary';
	}

	/**
	 * Get CSS class for status badge based on banned status
	 */
	function getStatusBadgeClass(banned: boolean | null | undefined): string {
		return banned ? 'badge-warning' : 'badge-success';
	}

	let lastFormResult: ActionData | null = $state(null);
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

			return async ({ result, update }: { result: ActionResult; update: () => void }) => {
				pendingSubmissions.delete(submissionKey);

				if (loadingToastId) {
					toast.dismiss(loadingToastId);
				}

				if (result.type === 'success' && result.data) {
					const resultData = result.data as ActionData;
					lastFormResult = resultData;

					if (resultData?.success) {
						toast.success(resultData.message || 'Operation completed successfully');
						showCreateModal = false;
						showEditModal = false;
						selectedUser = null;
					} else if (resultData?.error) {
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
										<div class="font-mono">{(user as User).username || 'N/A'}</div>
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
												<LoadingButton
													type="submit"
													class="btn-ghost btn-sm {user.emailVerified
														? 'text-warning'
														: 'text-success'}"
													title={user.emailVerified ? 'Mark as unverified' : 'Mark as verified'}
													loading={pendingSubmissions.has(`toggleEmailVerification-${user.id}`)}
												>
													{#if user.emailVerified}
														<X size={16} />
													{:else}
														<Check size={16} />
													{/if}
												</LoadingButton>
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
												<LoadingButton
													type="submit"
													class="btn-ghost btn-sm text-error"
													title="Delete user"
													loading={pendingSubmissions.has(`deleteUser-${user.id}`)}
													onclick={(e) => {
														if (!confirm('Are you sure you want to delete this user?')) {
															e?.preventDefault();
														}
													}}
												>
													<Trash2 size={16} />
												</LoadingButton>
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
<Modal isOpen={showCreateModal} onClose={closeCreateModal} title="Create New User" size="large">
	<form
		method="POST"
		action="?/createUser"
		use:enhance={createEnhancedSubmit('createUser')}
		class="space-y-4"
	>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<FormField
				id="create-name"
				name="name"
				label="Full Name"
				type="text"
				placeholder="John Doe"
				required
			/>

			<FormField
				id="create-email"
				name="email"
				label="Email"
				type="email"
				placeholder="john@example.com"
				required
			/>

			<FormField
				id="create-username"
				name="username"
				label="Username"
				type="text"
				placeholder="johndoe"
				required
			/>

			<FormField
				id="create-role"
				name="role"
				label="Role"
				type="select"
				options={roleOptions}
				required
			/>

			<FormField
				id="create-password"
				name="password"
				label="Password"
				type="password"
				placeholder="••••••••"
				required
			/>
		</div>

		<div class="modal-action">
			<button type="button" class="btn" onclick={closeCreateModal}>Cancel</button>
			<LoadingButton
				type="submit"
				class="btn-primary"
				loading={pendingSubmissions.has('createUser-new')}
			>
				Create User
			</LoadingButton>
		</div>
	</form>
</Modal>

<!-- Edit User Modal -->
<Modal isOpen={showEditModal} onClose={closeEditModal} title="Edit User" size="large">
	{#if selectedUser}
		<form
			method="POST"
			action="?/updateUser"
			use:enhance={createEnhancedSubmit('updateUser')}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedUser.id} />

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<FormField
					id="edit-name"
					name="name"
					label="Full Name"
					type="text"
					bind:value={selectedUser.name}
					required
				/>

				<FormField
					id="edit-email"
					name="email"
					label="Email"
					type="email"
					bind:value={selectedUser.email}
					required
				/>

				<FormField
					id="edit-username"
					name="username"
					label="Username"
					type="text"
					bind:value={selectedUser.username}
					helpText="Username normalization is handled by better-auth"
					required
				/>

				<FormField
					id="edit-role"
					name="role"
					label="Role"
					type="select"
					options={roleOptions}
					value={selectedUser.role || 'user'}
					required
				/>

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
					<FormField
						id="edit-ban-reason"
						name="banReason"
						label="Ban Reason"
						type="text"
						value={selectedUser.banReason || ''}
						placeholder="Reason for ban"
						class="md:col-span-2"
					/>

					<FormField
						id="edit-ban-expires"
						name="banExpires"
						label="Ban Expires (optional)"
						type="date"
						value={selectedUser.banExpires || ''}
						class="md:col-span-2"
					/>
				{/if}
			</div>

			<div class="modal-action">
				<button type="button" class="btn" onclick={closeEditModal}>Cancel</button>
				<LoadingButton
					type="submit"
					class="btn-primary"
					loading={pendingSubmissions.has(`updateUser-${selectedUser.id}`)}
				>
					Update User
				</LoadingButton>
			</div>
		</form>
	{/if}
</Modal>
