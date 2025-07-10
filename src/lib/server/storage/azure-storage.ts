import { logger } from '$lib/logger';
import type { ImageStorage } from './types';
import { AZURE_STORAGE_CONNECTION_STRING, AZURE_CONTAINER_NAME } from '$env/static/private';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { getFileExtension } from '.';

export class AzureBlobImageStorage implements ImageStorage {
	private containerClient: ContainerClient;
	private baseUrl: string;

	constructor() {
		const blobServiceClient = BlobServiceClient.fromConnectionString(
			AZURE_STORAGE_CONNECTION_STRING
		);

		this.baseUrl = '???';
		this.containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
	}

	async initialize(): Promise<void> {
		this.containerClient.createIfNotExists();
		this.containerClient.setAccessPolicy('container');
	}

	async uploadImage(imageId: string, buffer: Buffer, contentType: string): Promise<string> {
		const extension = getFileExtension(contentType);
		const blobName = `${imageId}${extension}`;

		try {
			const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
			const uploadBlobResponse = await blockBlobClient.upload(buffer, buffer.length);
			logger.info(
				{ upload_info: uploadBlobResponse, imageId },
				'Successfully uploaded image to Azure Blob Storage'
			);

			return `${AZURE_CONTAINER_NAME}/${blobName}`;
		} catch (error) {
			logger.error({ error, imageId }, 'Failed to upload image to Azure Blob Storage');
			throw error;
		}
	}

	getImageUrl(imagePath: string): string {
		// TODO: Return proper Azure blob URL
		// const [container, ...pathParts] = imagePath.split('/');
		// const blobName = pathParts.join('/');
		// return `${this.baseUrl}/${container}/${blobName}`;

		return `${this.baseUrl}/${imagePath}`;
	}

	async deleteImage(imagePath: string): Promise<void> {
		// TODO: Implement Azure blob deletion
		// const [container, ...pathParts] = imagePath.split('/');
		// const blobName = pathParts.join('/');
		// const containerClient = this.blobServiceClient.getContainerClient(container);
		// const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		// await blockBlobClient.delete();

		logger.warn({ imagePath }, 'Azure blob deletion not implemented yet');
		throw new Error('Azure Blob Storage deletion not implemented');
	}
}
