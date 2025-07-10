import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '$lib/logger';
import type { ImageStorage } from './types';
import { getFileExtension } from '.';

export class LocalImageStorage implements ImageStorage {
	private storagePath: string;
	private baseUrl: string;

	constructor() {
		this.storagePath =
			process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'static', 'uploads');
		this.baseUrl = process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:5173';
	}

	async initialize(): Promise<void> {
		try {
			await fs.mkdir(this.storagePath, { recursive: true });
			logger.info({ storagePath: this.storagePath }, 'Local storage initialized');
		} catch (error) {
			logger.error({ storagePath: this.storagePath, error }, 'Failed to initialize local storage');
			throw error;
		}
	}

	async uploadImage(imageId: string, buffer: Buffer, contentType: string): Promise<string> {
		try {
			const extension = getFileExtension(contentType);
			const fileName = `${imageId}${extension}`;
			const filePath = path.join(this.storagePath, fileName);

			await fs.writeFile(filePath, buffer);

			logger.debug({ imageId, fileName, contentType }, 'Image uploaded to local storage');

			return fileName;
		} catch (error) {
			logger.error({ imageId, error }, 'Failed to upload image to local storage');
			throw error;
		}
	}

	getImageUrl(imagePath: string): string {
		return `${this.baseUrl}/uploads/${imagePath}`;
	}

	async deleteImage(imagePath: string): Promise<void> {
		try {
			const fullPath = path.join(this.storagePath, imagePath);
			await fs.unlink(fullPath);
			logger.debug({ imagePath }, 'Image deleted from local storage');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				logger.debug({ imagePath }, 'Image not found in local storage (already deleted)');
				return;
			}
			logger.error({ imagePath, error }, 'Failed to delete image from local storage');
			throw error;
		}
	}
}
