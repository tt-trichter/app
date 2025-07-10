import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUserByUsername } from '$lib/server/db/router/users';
import { getUserStats, getRecentRunsForUser } from '$lib/server/db/router/runs';
import { logger } from '$lib/logger';

export const load: PageServerLoad = async ({ params }) => {
	const { username } = params;

	const user = await getUserByUsername(username);

	if (!user) {
		error(404, {
			code: 404,
			message: 'User not found'
		});
	}

	const [stats, recentRuns] = await Promise.all([
		getUserStats(user.id),
		getRecentRunsForUser(user.id, 3)
	]);

	logger.info({ recentRuns }, 'Loaded user profile');
	console.log('Recent Runs:', recentRuns);

	return {
		user: {
			id: user.id,
			name: user.name,
			username: user.username,
			displayUsername: user.displayUsername,
			image: user.image,
			createdAt: user.createdAt,
			role: user.role
		},
		stats,
		recentRuns
	};
};
