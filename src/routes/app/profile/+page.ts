import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { authClient } from '$lib/auth/client';

export const load: PageLoad = async () => {
	const session = await authClient.getSession();
	if (!session.data?.user) {
		redirect(307, '/auth/signin');
		return;
	}

	return {
		user: session.data.user
	};
};
