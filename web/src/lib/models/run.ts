import type { runsTable } from '$lib/server/db/schema/runs';
import { z } from 'zod';

export type Run = typeof runsTable.$inferSelect;
export type RunDatabseInsertObject = typeof runsTable.$inferInsert;

export type RunWithUser = Run & {
	user?: {
		id: string;
		name: string;
		username: string;
	} | null;
};

export const RunDcoSchema = z.object({
	duration: z.number().positive('Duration must be a positive number'),
	rate: z.number().positive('Rate must be a positive number'),
	volume: z.number().positive('Volume must be a positive number'),
	image: z.string().default('trichter-images/placeholder.jpg')
});

export type RunDco = z.infer<typeof RunDcoSchema>;
