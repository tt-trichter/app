<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { logger } from '$lib/logger';
	import { onMount } from 'svelte';

	let username = $state('');

	let error = $state<string | null>(null);
	let loading = $state(false);

	onMount(async () => {
		const session = await authClient.getSession();
		if (!session.data?.user) {
			goto('/app');
			return;
		}

		username = session.data.user.username ?? '';
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;

		const { error: updateError } = await authClient.updateUser({
			username: username.trim()
		});

		if (updateError) {
			logger.error('Failed to update username:', updateError.message);
			error = updateError.message ?? 'Failed to update username. Please try again.';
			loading = false;
			return;
		}

		logger.info('Username updated successfully in');
		goto('/app');
	}
</script>

<div class="flex h-screen flex-col justify-center align-middle">
	<div class="mockup-window border-base-300 border">
		<form class="p-10 pt-5" onsubmit={handleSubmit}>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Set your username</legend>
				<input
					type="text"
					class="input validator"
					placeholder="Type here"
					name="username"
					bind:value={username}
				/>
			</fieldset>
			{#if error}
				<p class="text-error text-s mb-4">{error}</p>
			{/if}

			<div class="divider"></div>
			<div class="mb-0 flex flex-col justify-center">
				<button class="btn btn-primary w-full" type="submit" disabled={loading}>
					{#if loading}
						Confirming...
					{:else}
						Confirm
					{/if}
				</button>
			</div>
		</form>
	</div>

	<div class="flex justify-center">
		<a class="btn btn-ghost" href="/app/profile"> ← Back to Profile </a>
	</div>
</div>
