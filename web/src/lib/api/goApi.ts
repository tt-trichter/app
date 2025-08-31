import type { RunWithUser, RunDco } from '$lib/models/run';

const API_BASE_URL = 'http://localhost:8090/api/v1';

export interface ApiResponse<T = unknown> {
	success: boolean;
	error?: string;
	details?: unknown;
	data?: T;
}

async function apiRequest<T = unknown>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;
	
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
}

export const runsApi = {
	async getRuns(): Promise<RunWithUser[]> {
		return apiRequest('/runs');
	},

	async createRun(runData: RunDco, basicAuth: string): Promise<ApiResponse> {
		return apiRequest('/runs', {
			method: 'POST',
			body: JSON.stringify(runData),
			headers: {
				Authorization: `Basic ${basicAuth}`
			}
		});
	},

	async updateRunUser(runId: string, userId: string): Promise<ApiResponse> {
		return apiRequest(`/runs/${runId}/user`, {
			method: 'PUT',
			body: JSON.stringify({ userId })
		});
	},

	async deleteRun(runId: string): Promise<ApiResponse> {
		return apiRequest(`/runs/${runId}`, {
			method: 'DELETE'
		});
	}
};

export const imagesApi = {
	async uploadImage(imageFile: File, basicAuth: string): Promise<string> {
		const response = await fetch(`${API_BASE_URL}/images`, {
			method: 'POST',
			body: imageFile,
			headers: {
				'Content-Type': imageFile.type,
				Authorization: `Basic ${basicAuth}`,
				Accept: 'text/plain'
			}
		});

		if (!response.ok) {
			throw new Error(`Upload failed: ${response.statusText}`);
		}

		return response.text();
	}
};

export const usersApi = {
	async searchUsers(name: string, limit: number = 10): Promise<Array<{
		id: string;
		name: string;
		username: string;
		displayUsername: string;
	}>> {
		const params = new URLSearchParams({
			name,
			limit: limit.toString()
		});
		return apiRequest(`/users/search?${params}`);
	}
};

export function createRunsSSEConnection(onMessage: (event: MessageEvent) => void): EventSource {
	const eventSource = new EventSource(`${API_BASE_URL}/runs/sse`, {
		withCredentials: true
	});

	eventSource.onmessage = onMessage;
	
	eventSource.onerror = (error) => {
		console.error('SSE connection error:', error);
	};

	return eventSource;
}
