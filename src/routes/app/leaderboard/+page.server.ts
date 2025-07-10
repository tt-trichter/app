import { getAllRunsWithUsers, updateRunWithUser, deleteRun } from '$lib/server/db/router/runs';
import { ServerEvent, resultEmitter } from '$lib/server/events';
import { auth } from '$lib/auth';
import { Role } from '$lib/models/roles';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RunWithUser } from '$lib/models/run';
import { validateRequiredFields } from '$lib/utils/validation';
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
		runs = await getAllRunsWithUsers();
	}

	return {
		runs: runs,
		user: session?.user || null
	};
};

export const actions: Actions = {
	updateName: async ({ request }) => {
		try {
			const form = await request.formData();

			const id = form.get('id') as string;
			const userId = form.get('user-id') as string;

			const validationResult = validateRequiredFields({ id, userId });
			if (!validationResult.success) {
				structuredLogger.api.error('Validation failed for updateName', validationResult.error, {
					runId: id,
					userId
				});
				return { error: 'Missing required fields' };
			}

			const updated = await updateRunWithUser(id, userId);

			if (updated) {
				structuredLogger.business.info('Run updated successfully', { runId: id, userId });
				resultEmitter.safeEmit(ServerEvent.RunUpdated, updated);
				return { success: true };
			}

			structuredLogger.business.error('Failed to update run', new Error('Update failed'), {
				runId: id,
				userId
			});
			return { error: 'Failed to update run' };
		} catch (error) {
			structuredLogger.api.error('Unexpected error updating run', error);
			return { error: 'An unexpected error occurred' };
		}
	},

	deleteRun: async ({ request }) => {
		try {
			const session = await auth.api.getSession({
				headers: request.headers
			});

			// Check if user is admin
			if (!session?.user || session.user.role !== Role.Admin) {
				structuredLogger.auth.unauthorized('Delete attempt by non-admin user', {
					userId: session?.user?.id
				});
				return fail(403, { error: 'Unauthorized: Admin access required' });
			}

			const form = await request.formData();
			const runId = form.get('runId') as string;

			if (!runId) {
				structuredLogger.api.error('Missing run ID in delete request', new Error('Missing runId'));
				return fail(400, { error: 'Missing run ID' });
			}

			const deleted = await deleteRun(runId);

			if (deleted) {
				structuredLogger.business.info('Run deleted successfully', {
					runId,
					adminId: session.user.id
				});
				// Emit deletion event for real-time updates
				resultEmitter.safeEmit(ServerEvent.RunDeleted, { id: runId });
				return { success: true, message: 'Run deleted successfully' };
			}

			structuredLogger.business.error('Failed to delete run', new Error('Delete failed'), {
				runId
			});
			return fail(500, { error: 'Failed to delete run' });
		} catch (error) {
			structuredLogger.api.error('Unexpected error deleting run', error);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
