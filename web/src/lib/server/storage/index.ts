import { logger } from '$lib/logger';

export type { ImageStorage, StorageConfig } from './types';
export { imageStorage } from './factory';
export { MinioImageStorage } from './minio-storage';
export { AzureBlobImageStorage } from './azure-storage';
export { LocalImageStorage } from './local-storage';

export function getFileExtension(contentType: string): string {
	switch (contentType) {
		case 'image/jpeg':
			return '.jpg';
		case 'image/png':
			return '.png';
		case 'image/gif':
			return '.gif';
		case 'image/webp':
			return '.webp';
		case 'image/svg+xml':
			return '.svg';
		default:
			logger.warn({ contentType }, 'Unknown content type, defaulting to .jpg');
			return '.jpg';
	}
}
