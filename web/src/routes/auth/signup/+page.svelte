<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { logger } from '$lib/logger';
	import { onMount } from 'svelte';

	let username = $state('');
	let name = $state('');
	let email = $state('');
	let password = $state('');

	let error = $state<string | null>(null);
	let loading = $state(false);

	onMount(async () => {
		const session = await authClient.getSession();
		if (session.data?.user) {
			goto('/app');
		}
	});
	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		loading = true;

		logger.info('Attempting to sign up user with username:', username);

		const realName = name.trim() || username;

		const { error: authError } = await authClient.signUp.email({
			email,
			password,
			name: realName,
			username
		});

		if (authError) {
			logger.error('Sign up failed:', authError.message);
			error = authError.message ?? 'Sign up failed. Please try again.';
			loading = false;
			return;
		}

		logger.info('User successfully signed up with username:', username);
		goto('/app');
	}

	async function signUpWithGoogle() {
		try {
			const data = await authClient.signIn.social({
				provider: 'google'
			});

			logger.info('User signed up with Google:', data);
		} catch (err) {
			logger.error('Google sign up error:', err);
		}
	}
</script>

<div class="flex h-screen flex-col justify-center align-middle">
	<div class="mockup-window border-base-300 border">
		<form class="p-10 pt-5" onsubmit={handleSubmit}>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Username *</legend>
				<input
					type="text"
					class="input"
					placeholder="Enter your username"
					name="username"
					bind:value={username}
					required
				/>
			</fieldset>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Name (optional)</legend>
				<input type="text" class="input" placeholder="Your name" name="name" bind:value={name} />
			</fieldset>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Email *</legend>
				<input
					type="email"
					class="input validator"
					placeholder="Enter your email"
					name="email"
					bind:value={email}
					required
				/>
			</fieldset>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Password *</legend>
				<input
					type="password"
					class="input validator"
					placeholder="Enter your password"
					name="password"
					bind:value={password}
					required
				/>
			</fieldset>
			{#if error}
				<p class="text-error text-s mb-4">{error}</p>
			{/if}

			<div class="divider"></div>
			<div class="mb-0 flex flex-col justify-center">
				<button class="btn btn-primary w-full" type="submit" disabled={loading}>
					{#if loading}
						Signing up…
					{:else}
						Sign Up
					{/if}
				</button>
				<a class="text-info text-s text-center underline" href="/auth/signin">SignIn instead</a>

				<div class="divider"></div>
				<div class="flex justify-center">
					<button class="btn" onclick={signUpWithGoogle} type="button">Sign Up with Google</button>
				</div>
			</div>
		</form>
	</div>
</div>
