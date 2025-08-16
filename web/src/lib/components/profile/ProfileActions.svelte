<script lang="ts">
	import { Settings, LogOut } from 'lucide-svelte';

	interface Props {
		isOwnProfile?: boolean;
	}

	let { isOwnProfile = false }: Props = $props();
</script>

<div class="flex flex-col justify-center gap-4 sm:flex-row">
	{#if isOwnProfile}
		<a class="btn btn-primary btn-lg gap-2" href="/auth/update-username">
			<Settings size={20} />
			Update Username
		</a>
		<a class="btn btn-outline btn-error btn-lg gap-2" href="/auth/signout">
			<LogOut size={20} />
			Sign Out
		</a>
	{:else}
		<a class="btn btn-ghost" href="/app/leaderboard"> ← Back to Leaderboard </a>
	{/if}
</div>
