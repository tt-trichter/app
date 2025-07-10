// Enhanced event system with better type safety and error handling
import { EventEmitter } from 'events';
import type { RunWithUser } from '$lib/models/run';
import { ServerEvent } from '$lib/models/events';
import { logger } from '$lib/logger';

// Re-export for server-side convenience
export { ServerEvent } from '$lib/models/events';

// Type-safe event payloads
export interface EventPayloads {
	[ServerEvent.RunCreated]: RunWithUser;
	[ServerEvent.RunUpdated]: RunWithUser;
	[ServerEvent.RunDeleted]: { id: string };
}

// Enhanced event emitter with type safety
class TypedEventEmitter extends EventEmitter {
	emit<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]): boolean {
		logger.debug({ event, payload }, 'Emitting typed event');
		return super.emit(event, payload);
	}

	on<K extends keyof EventPayloads>(event: K, listener: (payload: EventPayloads[K]) => void): this {
		return super.on(event, listener);
	}

	off<K extends keyof EventPayloads>(
		event: K,
		listener: (payload: EventPayloads[K]) => void
	): this {
		return super.off(event, listener);
	}

	once<K extends keyof EventPayloads>(
		event: K,
		listener: (payload: EventPayloads[K]) => void
	): this {
		return super.once(event, listener);
	}

	// Emit with error handling
	safeEmit<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]): boolean {
		try {
			return this.emit(event, payload);
		} catch (error) {
			logger.error({ event, payload, error }, 'Error emitting event');
			return false;
		}
	}
}

export const resultEmitter = new TypedEventEmitter();

// Set max listeners to prevent memory leak warnings in development
resultEmitter.setMaxListeners(50);
