import { logger } from '$lib/logger';
import type { ImageStorage } from './types';
import { MinioImageStorage } from './minio-storage';
import { AzureBlobImageStorage } from './azure-storage';
import { LocalImageStorage } from './local-storage';
import { STORAGE_PROVIDER } from '$env/static/private';

let storageInstance: ImageStorage | null = null;

async function createImageStorage(): Promise<ImageStorage> {
	if (storageInstance) {
		return storageInstance;
	}

	const provider = STORAGE_PROVIDER || 'minio';

	logger.info({ provider }, 'Initializing image storage provider');

	switch (provider.toLowerCase()) {
		case 'azure':
			storageInstance = new AzureBlobImageStorage();
			break;
		case 'local':
			storageInstance = new LocalImageStorage();
			break;
		case 'minio':
		default:
			storageInstance = new MinioImageStorage();
			break;
	}

	return storageInstance;
}

export async function initializeImageStorage(): Promise<ImageStorage> {
	try {
		const storage = await createImageStorage();
		await storage.initialize();
		return storage;
	} catch (e) {
		logger.error({ error: e }, 'Failed to initialize image storage');
		throw e;
	}
}

export const imageStorage = await initializeImageStorage();
