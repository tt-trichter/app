import { logger } from '$lib/logger';
import { ServerEvent } from '$lib/models/events';
import { getAllRunsWithUsers, saveRun } from '$lib/server/db/router/runs';
import { resultEmitter } from '$lib/server/events';
import { RunDcoSchema } from '$lib/models/run';
import type { RequestHandler } from './$types';
import { z } from 'zod';

export const GET: RequestHandler = async () => {
	logger.info('retrieving all runs...');
	const runs = await getAllRunsWithUsers();
	return new Response(JSON.stringify(runs), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization') ?? '';
	const expected = 'Basic dHJpY2h0ZXI6c3VwZXItc2FmZS1wYXNzd29yZA==';

	logger.info('received request', request);

	if (auth !== expected) {
		logger.warn('received request with invalid authentication');
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
				'WWW-Authenticate': 'Basic realm="Secure Area"'
			}
		});
	}

	const data = await request.json();

	try {
		const validatedData = RunDcoSchema.parse(data);

		const createdRun = await saveRun(validatedData, null); // No user assigned initially
		logger.info('created new run');

		resultEmitter.emit(ServerEvent.RunCreated, createdRun);

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.warn('validation error', { errors: error.errors });
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

		logger.error('error creating run', error);
		return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
