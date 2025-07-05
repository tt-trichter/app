import { getAllRunsWithUsers, updateRunWithUser, deleteRun } from '$lib/server/db/router/runs';
import { ServerEvent } from '$lib/models/events';
import { resultEmitter } from '$lib/server/events';
import { auth } from '$lib/auth';
import { Role } from '$lib/models/roles';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	const runs = await getAllRunsWithUsers();
	return {
		runs: runs,
		user: session?.user || null
	};
};

export const actions: Actions = {
	updateName: async ({ request }) => {
		const form = await request.formData();

		const id = form.get('id') as string;
		const userId = form.get('user-id') as string;

		if (!id || !userId) {
			return { error: 'Missing required fields' };
		}

		const updated = await updateRunWithUser(id, userId);

		if (updated) {
			resultEmitter.emit(ServerEvent.RunUpdated, updated);
			return { success: true };
		}

		return { error: 'Failed to update run' };
	},

	deleteRun: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		// Check if user is admin
		if (!session?.user || session.user.role !== Role.Admin) {
			return fail(403, { error: 'Unauthorized: Admin access required' });
		}

		const form = await request.formData();
		const runId = form.get('runId') as string;

		if (!runId) {
			return fail(400, { error: 'Missing run ID' });
		}

		const deleted = await deleteRun(runId);

		if (deleted) {
			// Emit deletion event for real-time updates
			resultEmitter.emit(ServerEvent.RunDeleted, { id: runId });
			return { success: true, message: 'Run deleted successfully' };
		}

		return fail(500, { error: 'Failed to delete run' });
	}
};
