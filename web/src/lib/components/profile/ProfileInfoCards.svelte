<script lang="ts">
	import { User, Mail, Calendar, Shield } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/date';

	interface Props {
		user: {
			email?: string;
			createdAt: Date;
			role?: string | null;
			emailVerified?: boolean | null;
			banned?: boolean | null;
			banReason?: string | null;
		};
		isOwnProfile?: boolean;
	}

	let { user, isOwnProfile = false }: Props = $props();
</script>

<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
	<div class="card bg-base-100 shadow-lg">
		<div class="card-body">
			<h2 class="card-title">
				<User size={20} />
				{isOwnProfile ? 'Personal Information' : 'Public Information'}
			</h2>
			<div class="space-y-3">
				{#if isOwnProfile && user.email}
					<div class="flex items-center gap-2">
						<Mail size={16} class="text-primary" />
						<span class="font-medium">Email:</span>
						<span class="text-sm">{user.email}</span>
					</div>
				{/if}
				<div class="flex items-center gap-2">
					<Calendar size={16} class="text-primary" />
					<span class="font-medium">Member since:</span>
					<span class="text-sm">{formatDate(user.createdAt)}</span>
				</div>
				{#if user.role}
					<div class="flex items-center gap-2">
						<Shield size={16} class="text-primary" />
						<span class="font-medium">Role:</span>
						<span class="badge badge-secondary badge-sm">{user.role}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if isOwnProfile}
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">
					<Shield size={20} />
					Account Status
				</h2>
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<span class="font-medium">Email Verified:</span>
						<div class="badge {user.emailVerified ? 'badge-success' : 'badge-warning'}">
							{user.emailVerified ? 'Verified' : 'Pending'}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="font-medium">Account Status:</span>
						<div class="badge {user.banned ? 'badge-error' : 'badge-success'}">
							{user.banned ? 'Banned' : 'Active'}
						</div>
					</div>
					{#if user.banned && user.banReason}
						<div class="alert alert-error alert-sm">
							<span class="text-xs">{user.banReason}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
