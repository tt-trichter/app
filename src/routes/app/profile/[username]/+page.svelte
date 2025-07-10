<script lang="ts">
	import type { PageData } from './$types';
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte';
	import ProfileInfoCards from '$lib/components/profile/ProfileInfoCards.svelte';
	import ProfileStats from '$lib/components/profile/ProfileStats.svelte';
	import RecentRuns from '$lib/components/profile/RecentRuns.svelte';
	import ProfileActions from '$lib/components/profile/ProfileActions.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto max-w-4xl p-4">
	<ProfileHeader user={data.user} />

	<ProfileInfoCards user={data.user} isOwnProfile={false} />

	<ProfileStats stats={data.stats} />

	<RecentRuns runs={data.recentRuns} />

	<ProfileActions isOwnProfile={false} />
</div>
