import { source } from 'sveltekit-sse';
import type { RunWithUser } from '$lib/models/run';
import { ServerEvent } from '$lib/models/events';
import { toast } from '$lib/stores/toast.svelte.js';
import { browser } from '$app/environment';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Enhanced runs store with better SSE connection management
export class RunsStore {
	runs = $state<RunWithUser[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	connectionState = $state<ConnectionState>('disconnected');

	private sseController: AbortController | null = null;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private maxReconnectAttempts = 5;
	private reconnectAttempts = 0;
	private lastEventTime = $state<number | null>(null);
	private connectionQuality = $state<'good' | 'poor' | 'unknown'>('unknown');

	constructor() {
		// Only setup SSE in browser environment
		if (browser) {
			this.setupServerSideEvents();
			this.setupNetworkListeners();
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
		this.checkConnectivityAndRetry();
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

	// Track event activity for connection quality
	private updateEventActivity() {
		this.lastEventTime = Date.now();
		this.connectionQuality = 'good';

		// Check connection quality periodically
		setTimeout(() => {
			const timeSinceLastEvent = Date.now() - (this.lastEventTime || 0);
			if (timeSinceLastEvent > 60000) {
				// 1 minute
				this.connectionQuality = 'poor';
			}
		}, 60000);
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

			// Handle new runs with better error handling
			eventSource
				.select(ServerEvent.RunCreated)
				.json<RunWithUser>()
				.subscribe((value: RunWithUser) => {
					try {
						if (!value || !value.id) {
							console.warn('Received invalid RunCreated event:', value);
							return;
						}
						this.updateEventActivity();
						this.updateOrAddRun(value);
						toast.success(
							`New run by ${value.user?.name || 'Unknown'}: ${value.data.rate.toFixed(2)} L/min!`
						);
					} catch (error: unknown) {
						console.error('Error handling RunCreated event:', error);
					}
				});

			// Handle run updates with better error handling
			eventSource
				.select(ServerEvent.RunUpdated)
				.json<RunWithUser>()
				.subscribe((value: RunWithUser) => {
					try {
						if (!value || !value.id) {
							console.warn('Received invalid RunUpdated event:', value);
							return;
						}
						this.updateEventActivity();
						this.updateOrAddRun(value);
						toast.info(
							`Run updated: ${value.user?.name || 'Unknown'} - ${value.data.rate.toFixed(2)} L/min`
						);
					} catch (error: unknown) {
						console.error('Error handling RunUpdated event:', error);
					}
				});

			// Handle run deletions with better error handling
			eventSource
				.select(ServerEvent.RunDeleted)
				.json<{ id: string }>()
				.subscribe((value: { id: string }) => {
					try {
						if (!value?.id) {
							console.warn('Received invalid RunDeleted event:', value);
							return;
						}
						this.updateEventActivity();
						this.removeRun(value.id);
						toast.warning('Run deleted');
					} catch (error: unknown) {
						console.error('Error handling RunDeleted event:', error);
					}
				});
		} catch (error: unknown) {
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
				// Only retry if we're still in an error state and the user hasn't manually disconnected
				if (this.connectionState === 'error') {
					this.setupServerSideEvents();
				}
			}, delay);
		} else {
			console.error('Max reconnection attempts reached');
			toast.error('Lost connection to server. Please refresh the page or click reconnect.');
		}
	}

	// Check for network connectivity and retry connection
	checkConnectivityAndRetry() {
		if (!browser) return;

		// Check if online
		if (!navigator.onLine) {
			console.log('Device is offline, waiting for network...');
			this.connectionState = 'error';
			return;
		}

		// Reset reconnection attempts when manually retrying
		this.reconnectAttempts = 0;
		this.setupServerSideEvents();
	}

	// Setup network connectivity listeners
	private setupNetworkListeners() {
		if (!browser) return;

		// Listen for online/offline events
		window.addEventListener('online', () => {
			console.log('Network connection restored');
			if (this.connectionState === 'error' || this.connectionState === 'disconnected') {
				this.checkConnectivityAndRetry();
			}
		});

		window.addEventListener('offline', () => {
			console.log('Network connection lost');
			this.connectionState = 'error';
			this.disconnect();
		});

		// Listen for visibility changes to reconnect when tab becomes active
		document.addEventListener('visibilitychange', () => {
			if (
				!document.hidden &&
				(this.connectionState === 'error' || this.connectionState === 'disconnected')
			) {
				console.log('Tab became visible, checking connection...');
				setTimeout(() => this.checkConnectivityAndRetry(), 1000);
			}
		});
	}

	get isConnecting() {
		return this.connectionState === 'connecting';
	}
	get hasError() {
		return this.connectionState === 'error';
	}
}

// Export a singleton instance
export const runsStore = new RunsStore();
