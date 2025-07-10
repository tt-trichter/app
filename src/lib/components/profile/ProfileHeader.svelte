<script lang="ts">
	import { User } from 'lucide-svelte';

	interface Props {
		user: {
			image?: string | null;
			displayUsername?: string | null;
			username?: string | null;
		};
		title?: string;
	}

	let { user, title }: Props = $props();
</script>

<svelte:head>
	<title>{title || `${user.displayUsername} - Profile`}</title>
</svelte:head>

<div class="hero bg-base-200 rounded-box mb-8">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<div class="avatar placeholder mb-4">
				<div class="bg-neutral text-neutral-content w-24 rounded-full">
					{#if user.image}
						<img src={user.image} alt="Profile" />
					{:else}
						<User size={48} />
					{/if}
				</div>
			</div>
			<h1 class="text-4xl font-bold">{user.displayUsername || user.username}</h1>
			<p class="text-lg opacity-75">@{user.username}</p>
		</div>
	</div>
</div>
