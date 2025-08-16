import { promises as fs } from 'fs';
import path from 'path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	// Only serve files in development or when using local storage
	const storageProvider = process.env.STORAGE_PROVIDER || 'minio';
	if (storageProvider !== 'local') {
		throw error(404);
	}

	const filename = params.filename;
	if (!filename) {
		throw error(400);
	}

	// Prevent directory traversal attacks
	if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
		throw error(400);
	}

	const storagePath = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads');
	const filePath = path.join(storagePath, filename);

	try {
		const buffer = await fs.readFile(filePath);

		// Determine content type based on file extension
		const ext = path.extname(filename).toLowerCase();
		let contentType = 'application/octet-stream';

		switch (ext) {
			case '.jpg':
			case '.jpeg':
				contentType = 'image/jpeg';
				break;
			case '.png':
				contentType = 'image/png';
				break;
			case '.gif':
				contentType = 'image/gif';
				break;
			case '.webp':
				contentType = 'image/webp';
				break;
			case '.svg':
				contentType = 'image/svg+xml';
				break;
		}

		return new Response(buffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
			}
		});
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			throw error(404);
		}
		throw error(500);
	}
};
