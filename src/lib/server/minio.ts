import * as Minio from 'minio'
import { MINIO_BASE_URL, MINIO_PORT, MINIO_BUCKET_NAME, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD } from '$env/static/private';
import { logger } from '$lib/logger';


export const minioClient = new Minio.Client({
	endPoint: MINIO_BASE_URL,
	port: parseInt(MINIO_PORT),
	useSSL: false,
	accessKey: MINIO_ROOT_USER,
	secretKey: MINIO_ROOT_PASSWORD,
})

const initMinio = async () => {
	const exists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
	if (exists) {
		logger.debug({ bucket_name: MINIO_BUCKET_NAME }, 'Bucket exists')
	} else {
		await minioClient.makeBucket(MINIO_BUCKET_NAME).catch((e) => {
			logger.error({ bucket_name: MINIO_BUCKET_NAME, error: e }, 'Failed to create bucket')
		}).then(() => {
			logger.info({ bucket_name: MINIO_BUCKET_NAME }, 'Bucket created')
		});
	}

	const downloadPolicy = {
		Version: '2012-10-17',
		Statement: [
			{
				Effect: 'Allow',
				Principal: { AWS: ['*'] },
				Action: ["s3:GetObject"],
				Resource: [`arn:aws:s3:::${MINIO_BUCKET_NAME}/*`]

			}
		]
	}

	await minioClient.setBucketPolicy(MINIO_BUCKET_NAME, JSON.stringify(downloadPolicy))
		.catch((e) => {
			logger.error({ bucket_name: MINIO_BUCKET_NAME, error: e }, 'Failed to update bucket policy')
		})
		.then(() => {
			logger.debug({ bucket_name: MINIO_BUCKET_NAME }, 'Bucket policy update')
		})

	const policy = await minioClient.getBucketPolicy(MINIO_BUCKET_NAME);
	logger.info({ bucket_name: MINIO_BUCKET_NAME, policy: JSON.parse(policy) }, 'Bucket initialized');
}

await initMinio();
