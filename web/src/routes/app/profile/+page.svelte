<script lang="ts">
	import type { PageData } from './$types';
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte';
	import ProfileInfoCards from '$lib/components/profile/ProfileInfoCards.svelte';
	import ProfileStats from '$lib/components/profile/ProfileStats.svelte';
	import RecentRuns from '$lib/components/profile/RecentRuns.svelte';
	import ProfileActions from '$lib/components/profile/ProfileActions.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto mt-2 w-full max-w-2xl p-4">
	<ProfileHeader user={data.user} title="Trichter - Profile" />

	<ProfileInfoCards user={data.user} isOwnProfile={true} />

	<ProfileStats stats={data.stats} />

	<RecentRuns runs={data.recentRuns} />

	<ProfileActions isOwnProfile={true} />
</div>
