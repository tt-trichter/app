import { browser } from '$app/environment';
import { PUBLIC_IMAGE_BASE_URL } from '$env/static/public';

export function getImageBaseUrl(): string {
	return PUBLIC_IMAGE_BASE_URL;
}

export function getClientImageUrl(imagePath: string): string {
	if (browser) {
		const baseUrl = getImageBaseUrl();
		return `${baseUrl}/${imagePath}`;
	}
	// This should not be called on server-side, use server/image.ts instead
	throw new Error('getClientImageUrl should only be called on client-side');
}

/**
 * Gets the full URL for an image given its path
 * This is the recommended way to get image URLs in components
 */
export function getImageUrl(imagePath: string): string {
	const baseUrl = getImageBaseUrl();
	return `${baseUrl}/${imagePath}`;
}
