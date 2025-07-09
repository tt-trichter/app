
export function successResponse(body: object): Response {
	return genericJsonResponse(body, 200);
}

export function badRequestResponse(message: string | null): Response {
	return genericJsonResponse({ error: message ?? 'Bad Request' }, 400)
}

export function unsupportedMediaTypeResponse(message: string | null): Response {
	return genericJsonResponse({ error: message ?? 'Unsupported Media Type' }, 415)
}

export function internalServerErrorReponse(message: string | null): Response {
	return genericJsonResponse({ error: message ?? 'Internal Server Error' }, 500);
}

function genericJsonResponse(body: object, status: number, headers?: HeadersInit | undefined): Response {
	const jsonHeaders = {
		'Content-Type': 'application',
		...(headers || {})
	};
	return genericResponse(body, status, jsonHeaders)
}

function genericResponse(body: object, status: number, headers: HeadersInit | undefined): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers
	})
}
