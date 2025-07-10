// Placeholder data for maintaining layout during skeleton loading
import type { RunWithUser } from '$lib/models/run';

export const createPlaceholderRuns = (count: number = 8): RunWithUser[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: `placeholder-${i}`,
		userId: i % 3 === 0 ? null : `user-${i}`,
		image: 'placeholder.jpg',
		data: {
			duration: 15.5,
			volume: 0.5,
			rate: 120.5
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		user:
			i % 3 === 0
				? null
				: {
						id: `user-${i}`,
						name: 'Loading User',
						email: 'loading@example.com',
						emailVerified: true,
						username: 'loading',
						displayUsername: 'loading',
						image: null,
						createdAt: new Date(),
						updatedAt: new Date(),
						role: null,
						banned: null,
						banReason: null,
						banExpires: null
					}
	}));
};

export const placeholderRuns = createPlaceholderRuns(8);
