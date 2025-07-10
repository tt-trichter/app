import { source } from 'sveltekit-sse';
import type { RunWithUser } from '$lib/models/run';
import { ServerEvent } from '$lib/models/events';
import { toast } from '$lib/stores/toast.svelte.js';
import { browser } from '$app/environment';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Enhanced runs store with better SSE connection magement
export class RunsStore {
	runs = $state<RunWithUser[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	connectionState = $state<ConnectionState>('disconnected');

	private sseController: AbortController | null = null;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private maxReconnectAttempts = 5;
	private reconnectAttempts = 0;

	constructor() {
		// Only setup SSE in browser environment
		if (browser) {
			this.setupServerSideEvents();
		}
	}

	// Initialize runs data
	initialize(initialRuns: RunWithUser[]) {
		this.runs = initialRuns;
	}

	// Load runs from server if not already loaded or stale
	async loadRunsIfNeeded(forceRefresh = false) {
		// If we already have data and don't need to force refresh, skip loading
		if (this.runs.length > 0 && !forceRefresh) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			const response = await fetch('/api/v1/runs');
			if (!response.ok) {
				throw new Error(`Failed to fetch runs: ${response.statusText}`);
			}

			const runs: RunWithUser[] = await response.json();
			this.runs = runs;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load runs';
			console.error('Error loading runs:', err);
		} finally {
			this.isLoading = false;
		}
	}

	// Initialize with data if provided, otherwise load from server
	async initializeOrLoad(initialRuns?: RunWithUser[]) {
		if (initialRuns && initialRuns.length > 0) {
			this.initialize(initialRuns);
		} else {
			await this.loadRunsIfNeeded();
		}
	}

	// Sort runs by different criteria
	get runsByRate() {
		return this.runs.slice().sort((a, b) => b.data.rate - a.data.rate);
	}

	get runsByTimestamp() {
		return this.runs
			.slice()
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	// Statistics
	get totalRuns() {
		return this.runs.length;
	}

	get quickestRun() {
		return this.runs.length
			? this.runs.reduce((fastest, curr) =>
					curr.data.duration < fastest.data.duration ? curr : fastest
				)
			: null;
	}

	// Update or add a run
	updateOrAddRun(run: RunWithUser) {
		const existingIndex = this.runs.findIndex((r) => r.id === run.id);
		if (existingIndex >= 0) {
			this.runs[existingIndex] = run;
		} else {
			this.runs.push(run);
		}
	}

	// Remove a run
	removeRun(runId: string) {
		this.runs = this.runs.filter((r) => r.id !== runId);
	}

	// Check if store is empty (needs loading)
	get isEmpty() {
		return this.runs.length === 0;
	}

	// Manual reconnection
	reconnect() {
		this.disconnect();
		this.reconnectAttempts = 0;
		this.setupServerSideEvents();
	}

	// Disconnect SSE
	disconnect() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.sseController) {
			this.sseController.abort();
			this.sseController = null;
		}

		this.connectionState = 'disconnected';
	}

	// Cleanup method for when store is destroyed
	destroy() {
		this.disconnect();
	}

	// Setup server-side events with enhanced error handling and reconnection
	private setupServerSideEvents() {
		if (!browser) return;

		// Prevent multiple connections
		if (this.sseController) {
			this.disconnect();
		}

		this.connectionState = 'connecting';
		this.sseController = new AbortController();

		try {
			const eventSource = source('/api/v1/runs/sse', {
				options: {
					method: 'POST'
				}
			});

			// Handle connection state
			this.connectionState = 'connected';
			this.reconnectAttempts = 0;

			// Handle new runs
			eventSource
				.select(ServerEvent.RunCreated)
				.json<RunWithUser>()
				.subscribe((value: RunWithUser) => {
					if (!value) return;
					this.updateOrAddRun(value);
					toast.success(
						`New run by ${value.user?.name || 'Unknown'}: ${value.data.rate.toFixed(2)} L/min!`
					);
				});

			// Handle run updates
			eventSource
				.select(ServerEvent.RunUpdated)
				.json<RunWithUser>()
				.subscribe((value: RunWithUser) => {
					if (!value) return;
					this.updateOrAddRun(value);
					toast.info(
						`Run updated: ${value.user?.name || 'Unknown'} - ${value.data.rate.toFixed(2)} L/min`
					);
				});

			// Handle run deletions
			eventSource
				.select(ServerEvent.RunDeleted)
				.json<{ id: string }>()
				.subscribe((value: { id: string }) => {
					if (!value?.id) return;
					this.removeRun(value.id);
					toast.warning('Run deleted');
				});
		} catch (error) {
			console.error('Failed to setup SSE connection:', error);
			this.handleConnectionError(error);
		}
	}

	private handleConnectionError(error: unknown) {
		console.error('SSE connection error:', error);
		this.connectionState = 'error';

		// Attempt to reconnect with exponential backoff
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
			this.reconnectAttempts++;

			console.log(
				`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
			);

			this.reconnectTimeout = setTimeout(() => {
				this.setupServerSideEvents();
			}, delay);
		} else {
			console.error('Max reconnection attempts reached');
			toast.error('Lost connection to server. Please refresh the page.');
		}
	}
}

// Export a singleton instance
export const runsStore = new RunsStore();
