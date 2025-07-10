import type { PageServerLoad } from './$types';
import { getUserStats } from '$lib/server/db/router/runs';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	const stats = await getUserStats(user.id);
	
	return {
		stats
	};
};
