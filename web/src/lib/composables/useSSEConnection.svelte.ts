import { browser } from '$app/environment';
import { onDestroy } from 'svelte';
import { source } from 'sveltekit-sse';

export interface SSEConnectionOptions {
	url: string;
	maxReconnectAttempts?: number;
	reconnectBaseDelay?: number;
	maxReconnectDelay?: number;
}

export type SSEConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SSEEventHandler<T = unknown> {
	eventName: string;
	handler: (data: T) => void;
}

/**
 * A composable for managing SSE connections with automatic reconnection and error handling
 * Following Svelte 5 best practices with runes and proper cleanup
 */
export function useSSEConnection(options: SSEConnectionOptions) {
	let connectionState = $state<SSEConnectionState>('disconnected');
	let reconnectAttempts = $state(0);
	let error = $state<string | null>(null);

	const {
		url,
		maxReconnectAttempts = 5,
		reconnectBaseDelay = 1000,
		maxReconnectDelay = 30000
	} = options;

	let controller: AbortController | null = null;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let eventHandlers: SSEEventHandler[] = [];

	function connect() {
		if (!browser) return;

		// Prevent multiple connections
		if (controller) {
			disconnect();
		}

		connectionState = 'connecting';
		error = null;
		controller = new AbortController();

		try {
			const eventSource = source(url, {
				options: {
					method: 'POST'
				}
			});

			connectionState = 'connected';
			reconnectAttempts = 0;

			// Setup all registered event handlers
			eventHandlers.forEach(({ eventName, handler }) => {
				eventSource
					.select(eventName)
					.json()
					.subscribe((data: unknown) => {
						try {
							handler(data);
						} catch (err) {
							console.error(`Error in event handler for ${eventName}:`, err);
						}
					});
			});
		} catch (err) {
			console.error('Failed to setup SSE connection:', err);
			handleConnectionError(err);
		}
	}

	function disconnect() {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		if (controller) {
			controller.abort();
			controller = null;
		}

		connectionState = 'disconnected';
	}

	function reconnect() {
		disconnect();
		reconnectAttempts = 0;
		connect();
	}

	function addEventHandler<T = unknown>(eventName: string, handler: (data: T) => void) {
		eventHandlers.push({ eventName, handler: handler as (data: unknown) => void });

		// If already connected, immediately setup this handler
		if (connectionState === 'connected' && controller) {
			const eventSource = source(url, {
				options: {
					method: 'POST'
				}
			});

			eventSource
				.select(eventName)
				.json()
				.subscribe((data: unknown) => {
					try {
						handler(data as T);
					} catch (err) {
						console.error(`Error in event handler for ${eventName}:`, err);
					}
				});
		}
	}

	function removeEventHandler(eventName: string) {
		eventHandlers = eventHandlers.filter((handler) => handler.eventName !== eventName);
	}

	function handleConnectionError(err: unknown) {
		console.error('SSE connection error:', err);
		connectionState = 'error';
		error = err instanceof Error ? err.message : 'Connection failed';

		// Attempt to reconnect with exponential backoff
		if (reconnectAttempts < maxReconnectAttempts) {
			const delay = Math.min(
				reconnectBaseDelay * Math.pow(2, reconnectAttempts),
				maxReconnectDelay
			);

			reconnectAttempts++;

			console.log(
				`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`
			);

			reconnectTimeout = setTimeout(() => {
				connect();
			}, delay);
		} else {
			console.error('Max reconnection attempts reached');
			error = 'Max reconnection attempts reached';
		}
	}

	// Cleanup when component unmounts
	onDestroy(() => {
		disconnect();
	});

	return {
		// Reactive state
		get connectionState() {
			return connectionState;
		},
		get reconnectAttempts() {
			return reconnectAttempts;
		},
		get error() {
			return error;
		},
		get isConnected() {
			return connectionState === 'connected';
		},
		get isConnecting() {
			return connectionState === 'connecting';
		},
		get hasError() {
			return connectionState === 'error';
		},

		// Methods
		connect,
		disconnect,
		reconnect,
		addEventHandler,
		removeEventHandler
	};
}
