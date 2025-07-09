import { getAllRunsWithUsers, updateRunWithUser } from '$lib/server/db/router/runs';
import { ServerEvent } from '$lib/models/events';
import { resultEmitter } from '$lib/server/events';
import { auth } from '$lib/auth';
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
	claimRun: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session?.user) {
			return { error: 'Not logged in' }
		}

		const form = await request.formData();
		const id = form.get('id') as string;

		const updated = await updateRunWithUser(id, session.user.id);

		if (updated) {
			resultEmitter.emit(ServerEvent.RunUpdated, updated);
			return { success: true };
		}

		return { error: 'Failed to update run' };
	},
};
