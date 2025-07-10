import { logger } from '$lib/logger';
import { ServerEvent, resultEmitter } from '$lib/server/events';
import { getAllRunsWithUsers, saveRun } from '$lib/server/db/router/runs';
import { RunDcoSchema } from '$lib/models/run';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { requireBasicAuth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request }) => {
	logger.info({ request }, 'All runs requested');
	const runs = await getAllRunsWithUsers();
	return new Response(JSON.stringify(runs), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	logger.info({ request }, 'Create run requested');
	const { unauthorized, response } = requireBasicAuth(request);
	if (unauthorized) return response;

	const data = await request.json();

	try {
		const validatedData = RunDcoSchema.parse(data);

		const createdRun = await saveRun(validatedData, null);
		logger.info({ run: createdRun }, 'Created new run');

		resultEmitter.safeEmit(ServerEvent.RunCreated, createdRun);

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.warn({ errors: error.errors }, 'Failed to validate run data');
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Validation failed',
					details: error.errors
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		logger.error({ error }, 'Failed to create run');
		return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
