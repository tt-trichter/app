<script lang="ts">
	import type { PageData } from './$types';
	import { User, Settings, LogOut, Mail, Calendar, Shield, TrendingUp } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const formatDate = (date: string | Date) => {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(new Date(date));
	};

	const formatNumber = (num: number) => {
		return num > 0 ? num.toFixed(2) : '--';
	};
</script>

<div class="container mx-auto max-w-4xl p-4">
	<div class="hero bg-base-200 rounded-box mb-8">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<div class="avatar placeholder mb-4">
					<div class="bg-neutral text-neutral-content w-24 rounded-full">
						{#if data.user.image}
							<img src={data.user.image} alt="Profile" />
						{:else}
							<User size={48} />
						{/if}
					</div>
				</div>
				<h1 class="text-4xl font-bold">{data.user.displayUsername}</h1>
				<p class="text-lg opacity-75">@{data.user.username}</p>
			</div>
		</div>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Personal Information -->
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">
					<User size={20} />
					Personal Information
				</h2>
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<Mail size={16} class="text-primary" />
						<span class="font-medium">Email:</span>
						<span class="text-sm">{data.user.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<Calendar size={16} class="text-primary" />
						<span class="font-medium">Member since:</span>
						<span class="text-sm">{formatDate(data.user.createdAt)}</span>
					</div>
					{#if data.user.role}
						<div class="flex items-center gap-2">
							<Shield size={16} class="text-primary" />
							<span class="font-medium">Role:</span>
							<span class="badge badge-secondary badge-sm">{data.user.role}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Account Status -->
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">
					<Shield size={20} />
					Account Status
				</h2>
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<span class="font-medium">Email Verified:</span>
						<div class="badge {data.user.emailVerified ? 'badge-success' : 'badge-warning'}">
							{data.user.emailVerified ? 'Verified' : 'Pending'}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="font-medium">Account Status:</span>
						<div class="badge {data.user.banned ? 'badge-error' : 'badge-success'}">
							{data.user.banned ? 'Banned' : 'Active'}
						</div>
					</div>
					{#if data.user.banned && data.user.banReason}
						<div class="alert alert-error alert-sm">
							<span class="text-xs">{data.user.banReason}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Statistics (Placeholder for PB and other stats) -->
		<div class="card bg-base-100 shadow-lg md:col-span-2">
			<div class="card-body">
				<h2 class="card-title">
					<TrendingUp size={20} />
					Statistics
				</h2>
				<div class="stats stats-vertical sm:stats-horizontal bg-base-200 w-full">
					<div class="stat">
						<div class="stat-title">Personal Best</div>
						<div class="stat-value text-primary">{formatNumber(data.stats.personalBest)}</div>
						<div class="stat-desc">{data.stats.personalBest > 0 ? 'L/min' : 'No runs yet'}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Total Liters</div>
						<div class="stat-value text-secondary">{formatNumber(data.stats.totalLiters)}</div>
						<div class="stat-desc">{data.stats.totalRuns} total runs</div>
					</div>
					<div class="stat">
						<div class="stat-title">Average Rate</div>
						<div class="stat-value text-accent">{formatNumber(data.stats.averageRate)}</div>
						<div class="stat-desc">{data.stats.averageRate > 0 ? 'L/min' : 'No data'}</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-col justify-center gap-4 sm:flex-row">
		<a class="btn btn-primary btn-lg gap-2" href="/auth/update-username">
			<Settings size={20} />
			Update Username
		</a>
		<a class="btn btn-outline btn-error btn-lg gap-2" href="/auth/signout">
			<LogOut size={20} />
			Sign Out
		</a>
	</div>
</div>
