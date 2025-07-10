export interface ImageStorage {
	uploadImage(imageId: string, buffer: Buffer, contentType: string): Promise<string>;
	getImageUrl(imagePath: string): string;
	deleteImage(imagePath: string): Promise<void>;
	initialize(): Promise<void>;
}

export interface StorageConfig {
	provider: 'minio' | 'azure' | 'local';
}
