import { json } from '@sveltejs/kit';
import { searchUsers } from '$lib/server/db/router/users';
import type { RequestHandler } from './$types';
import { logger } from '$lib/logger';

export const GET: RequestHandler = async ({ url }) => {
	const usernameQuery = url.searchParams.get('name');
	const limitParam = url.searchParams.get('limit');

	if (!usernameQuery || usernameQuery.trim().length < 2) {
		return json([]);
	}

	const limit = limitParam ? parseInt(limitParam, 10) : 10;

	try {
		const users = await searchUsers(usernameQuery, limit);

		// Return only necessary fields for the frontend
		const searchResults = users.map((user) => ({
			id: user.id,
			name: user.name,
			username: user.username,
			displayUsername: user.displayUsername
		}));

		logger.info(`Searched users with query: ${usernameQuery}, found ${searchResults.length} users`);
		return json(searchResults);
	} catch (error) {
		logger.error('Error searching users:', error);
		return json([], { status: 500 });
	}
};
