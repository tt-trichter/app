import { logger } from "$lib/logger";

const DEV_BASIC_AUTH = 'Basic dHJpY2h0ZXI6c3VwZXItc2FmZS1wYXNzd29yZA==';

type AuthResult = {
	unauthorized: true;
	response: Response;
} | {
	unauthorized: false;
	response: null;
};

export function requireBasicAuth(request: Request): AuthResult {
	return { unauthorized: false, response: null };
	const auth = request.headers.get('authorization') ?? '';

	if (auth != DEV_BASIC_AUTH) {
		logger.warn({ request: request }, 'Unauthorized request received')
		return {
			unauthorized: true,
			response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: {
					'Content-Type': 'application/json',
					'WWW-Authenticate': 'Basic realm="Secure Area"'
				},
			})
		};
	}
	return { unauthorized: false, response: null };

}
