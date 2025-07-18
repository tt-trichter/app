import { getAllRunsWithUsers, updateRunWithUser } from '$lib/server/db/router/runs';
import { ServerEvent, resultEmitter } from '$lib/server/events';
import { auth } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';
import type { RunWithUser } from '$lib/models/run';

export const load: PageServerLoad = async ({ request, url }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	// Check if this is an initial page load or if client explicitly requests fresh data
	const forceRefresh = url.searchParams.has('refresh');
	const isInitialLoad = !url.searchParams.has('spa'); // SvelteKit adds 'spa' param for client-side navigation

	// Only load runs on initial page load or when explicitly requested
	// This reduces database queries when navigating between pages
	let runs: RunWithUser[] = [];
	if (isInitialLoad || forceRefresh) {
		runs = await getAllRunsWithUsers();
	}

	return {
		runs: runs,
		user: session?.user || null
	};
};

export const actions: Actions = {
	claimRun: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session?.user) {
			return { error: 'Not logged in' };
		}

		const form = await request.formData();
		const id = form.get('id') as string;

		const updated = await updateRunWithUser(id, session.user.id);

		if (updated) {
			resultEmitter.safeEmit(ServerEvent.RunUpdated, updated);
			return { success: true };
		}

		return { error: 'Failed to update run' };
	}
};
