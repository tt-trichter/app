import { logger } from '$lib/logger';
import { ServerEvent, resultEmitter } from '$lib/server/events';
import { RunDcoSchema } from '$lib/models/run';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { requireBasicAuth } from '$lib/server/auth';

// Proxy to Go API
const GO_API_BASE = 'http://localhost:8090/api/v1';

export const GET: RequestHandler = async ({ request }) => {
	logger.info({ request }, 'All runs requested - proxying to Go API');
	
	try {
		const response = await fetch(`${GO_API_BASE}/runs`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			logger.error({ status: response.status }, 'Go API request failed');
			return new Response(JSON.stringify({ error: 'Failed to fetch runs' }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const runs = await response.json();
		return new Response(JSON.stringify(runs), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		logger.error({ error }, 'Failed to proxy to Go API');
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const POST: RequestHandler = async ({ request }) => {
	logger.info({ request }, 'Create run requested - proxying to Go API');
	
	// Validate basic auth before proxying
	const { unauthorized, response } = requireBasicAuth(request);
	if (unauthorized) return response;

	const data = await request.json();

	try {
		const validatedData = RunDcoSchema.parse(data);

		// Forward to Go API with auth headers
		const authHeader = request.headers.get('authorization');
		const goResponse = await fetch(`${GO_API_BASE}/runs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': authHeader || '',
			},
			body: JSON.stringify(validatedData),
		});

		if (!goResponse.ok) {
			logger.error({ status: goResponse.status }, 'Go API create run failed');
			const errorData = await goResponse.json().catch(() => ({}));
			return new Response(JSON.stringify(errorData), {
				status: goResponse.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const result = await goResponse.json();
		logger.info({ result }, 'Run created via Go API');

		// TODO: Emit SSE event when Go API supports it
		// For now, we'll rely on the Go API to handle SSE events

		return new Response(JSON.stringify(result), {
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
