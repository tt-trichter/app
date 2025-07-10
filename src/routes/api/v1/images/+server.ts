import { logger } from '$lib/logger';
import type { RequestHandler } from './$types';
import { imageStorage } from '$lib/server/storage';
import { requireBasicAuth } from '$lib/server/auth';
import {
	internalServerErrorResponse,
	successResponse,
	unsupportedMediaTypeResponse
} from '$lib/response-helper';

function createImageId() {
	return crypto.randomUUID();
}

export const POST: RequestHandler = async ({ request }) => {
	logger.info({ request }, 'Upload image requested');
	const { unauthorized, response } = requireBasicAuth(request);
	if (unauthorized) return response;

	const contentType = request.headers.get('content-type');
	if (!contentType || !contentType.includes('image/jpeg')) {
		logger.warn({ request }, 'Invalid Content-Type received');
		return unsupportedMediaTypeResponse('Invalid content type. Only JPEG images are allowed.');
	}

	const acceptHeader = request.headers.get('accept') || '';

	const imageBuffer = Buffer.from(await request.arrayBuffer());

	const imageId = createImageId();

	try {
		const resourcePath = await imageStorage.uploadImage(imageId, imageBuffer, contentType);
		logger.info({ imageId, resourcePath }, 'Successfully uploaded image');

		if (acceptHeader.includes('text/plain')) {
			return new Response(resourcePath, {
				status: 200,
				headers: { 'Content-Type': 'text/plain' }
			});
		} else {
			return successResponse({
				resource: resourcePath
			});
		}
	} catch (e) {
		console.error(e);
		logger.error({ error: e, request }, 'Failed to upload image');
		return internalServerErrorResponse('Failed to upload image');
	}
};
