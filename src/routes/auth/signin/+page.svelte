<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { logger } from '$lib/logger';
	import { onMount } from 'svelte';

	let userLogin = $state('');
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

		let authError: any = null;
		if (userLogin.includes('@')) {
			logger.info('Attempting sign in with email');
			authError = await signInWithEmail(userLogin, password);

			if (authError) {
				logger.warn('Email sign in failed, trying username fallback:', authError.message);
				authError = await signInWithUsername(userLogin, password);
			}
		} else {
			logger.info('Attempting sign in with username');
			authError = await signInWithUsername(userLogin, password);

			if (authError) {
				logger.warn('Username sign in failed, trying email fallback:', authError.message);
				authError = await signInWithEmail(userLogin, password);
			}
		}

		if (authError) {
			logger.error('Both sign in methods failed:', authError.message);
			error = authError.message ?? 'Login failed. Please check your credentials.';
			loading = false;
			return;
		}

		logger.info('User successfully signed in');
		goto('/app');
	}

	async function signInWithEmail(email: string, password: string) {
		const { error: authError } = await authClient.signIn.email({
			email,
			password
		});

		if (authError) {
			logger.warn('Email sign in failed:', authError.message);
		} else {
			logger.info('Email sign in successful');
		}

		return authError;
	}

	async function signInWithUsername(username: string, password: string) {
		const { error: authError } = await authClient.signIn.username({
			username,
			password
		});

		if (authError) {
			logger.warn('Username sign in failed:', authError.message);
		} else {
			logger.info('Username sign in successful');
		}

		return authError;
	}

	async function signInWithGoogle() {
		const data = await authClient.signIn.social({
			provider: 'google'
		});

		logger.info('user logged in with google:', data);
	}
</script>

<div class="flex h-screen flex-col justify-center align-middle">
	<div class="mockup-window border-base-300 border">
		<form class="p-10 pt-5" onsubmit={handleSubmit}>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Email/Username</legend>
				<input
					type="text"
					class="input validator"
					placeholder="Type here"
					name="userLogin"
					bind:value={userLogin}
				/>
			</fieldset>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Password</legend>
				<input
					type="password"
					class="input validator"
					placeholder="Type here"
					name="password"
					bind:value={password}
				/>
			</fieldset>
			{#if error}
				<p class="text-error text-s mb-4">{error}</p>
			{/if}

			<div class="divider"></div>
			<div class="mb-0 flex flex-col justify-center">
				<button class="btn btn-primary w-full" type="submit" disabled={loading}>
					{#if loading}
						Signing in…
					{:else}
						Sign In
					{/if}
				</button>
				<a class="text-info text-s text-center underline" href="/auth/signup">SignUp instead</a>
			</div>
			<div class="divider"></div>
			<div class="flex justify-center">
				<button class="btn" onclick={signInWithGoogle} type="button">Sign In with Google</button>
			</div>
		</form>
	</div>
</div>
