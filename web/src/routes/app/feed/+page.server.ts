import { ServerEvent, resultEmitter } from '$lib/server/events';
import { auth } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';
import type { RunWithUser } from '$lib/models/run';
import { runsApi } from '$lib/api/goApi';
import { structuredLogger } from '$lib/utils/structuredLogger';

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
		try {
			runs = await runsApi.getRuns();
		} catch (error) {
			structuredLogger.api.error('Failed to load runs from Go API', error);
			runs = []; // Fallback to empty array
		}
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

		try {
			await runsApi.updateRunUser(id, session.user.id);
			structuredLogger.business.info('Run claimed successfully via Go API', { 
				runId: id, 
				userId: session.user.id 
			});
			
			// Note: Skipping SSE emission for now, relying on client-side updates
			// TODO: Implement proper SSE events in Go API
			
			return { success: true };
		} catch (error) {
			structuredLogger.api.error('Failed to claim run via Go API', error);
			return { error: 'Failed to update run' };
		}
	}
};
