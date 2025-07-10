import * as Minio from 'minio';
import {
	MINIO_BASE_URL,
	MINIO_BUCKET_NAME,
	MINIO_ROOT_USER,
	MINIO_ROOT_PASSWORD,
	MINIO_PORT
} from '$env/static/private';
import { logger } from '$lib/logger';
import type { ImageStorage } from './types';
import { getFileExtension } from '.';

export class MinioImageStorage implements ImageStorage {
	private client: Minio.Client;
	private bucketName: string;
	private baseUrl: string;

	constructor() {
		this.client = new Minio.Client({
			endPoint: MINIO_BASE_URL,
			port: parseInt(MINIO_PORT),
			useSSL: false,
			accessKey: MINIO_ROOT_USER,
			secretKey: MINIO_ROOT_PASSWORD
		});
		this.bucketName = MINIO_BUCKET_NAME;
		this.baseUrl = `http://${MINIO_BASE_URL}`;
	}

	async initialize(): Promise<void> {
		const exists = await this.client.bucketExists(this.bucketName);
		if (exists) {
			logger.debug({ bucket_name: this.bucketName }, 'Bucket exists');
		} else {
			await this.client
				.makeBucket(this.bucketName)
				.catch((e) => {
					logger.error({ bucket_name: this.bucketName, error: e }, 'Failed to create bucket');
					throw e;
				})
				.then(() => {
					logger.info({ bucket_name: this.bucketName }, 'Bucket created');
				});
		}

		const downloadPolicy = {
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: { AWS: ['*'] },
					Action: ['s3:GetObject'],
					Resource: [`arn:aws:s3:::${this.bucketName}/*`]
				}
			]
		};

		await this.client
			.setBucketPolicy(this.bucketName, JSON.stringify(downloadPolicy))
			.catch((e) => {
				logger.error({ bucket_name: this.bucketName, error: e }, 'Failed to update bucket policy');
				throw e;
			})
			.then(() => {
				logger.debug({ bucket_name: this.bucketName }, 'Bucket policy updated');
			});

		logger.info({ bucket_name: this.bucketName }, 'MinIO storage initialized');
	}

	async uploadImage(imageId: string, buffer: Buffer, contentType: string): Promise<string> {
		const extension = getFileExtension(contentType);
		const objectName = `${imageId}${extension}`;

		try {
			const uploadInfo = await this.client.putObject(this.bucketName, objectName, buffer);
			logger.info({ upload_info: uploadInfo, imageId }, 'Successfully uploaded image to MinIO');

			return `${this.bucketName}/${objectName}`;
		} catch (error) {
			logger.error({ error, imageId }, 'Failed to upload image to MinIO');
			throw error;
		}
	}

	getImageUrl(imagePath: string): string {
		const [bucket, ...pathParts] = imagePath.split('/');
		const filename = pathParts.join('/');
		return `${this.baseUrl}/${bucket}/${filename}`;
	}

	async deleteImage(imagePath: string): Promise<void> {
		const [bucket, ...pathParts] = imagePath.split('/');
		const objectName = pathParts.join('/');

		try {
			await this.client.removeObject(bucket, objectName);
			logger.info({ imagePath }, 'Successfully deleted image from MinIO');
		} catch (error) {
			logger.error({ error, imagePath }, 'Failed to delete image from MinIO');
			throw error;
		}
	}
}
