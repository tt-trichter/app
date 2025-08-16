import type { PageServerLoad } from './$types';
import { getUserStats, getRecentRunsForUser } from '$lib/server/db/router/runs';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const [stats, recentRuns] = await Promise.all([
		getUserStats(user.id),
		getRecentRunsForUser(user.id, 3)
	]);

	return {
		stats,
		recentRuns
	};
};
