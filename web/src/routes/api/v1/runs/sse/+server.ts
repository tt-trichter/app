import type { RunWithUser } from '$lib/models/run';
import { ServerEvent, resultEmitter } from '$lib/server/events';
import { produce } from 'sveltekit-sse';
import type { RequestHandler } from './$types';
import { logger } from '$lib/logger';

// For now, we'll keep the existing SvelteKit SSE implementation
// and gradually migrate to Go API SSE when it's fully implemented
export const POST: RequestHandler = () => {
	let onNew: (entry: RunWithUser) => void;
	let onUpdate: (entry: RunWithUser) => void;
	let onDelete: (entry: { id: string }) => void;

	return produce(
		async ({ emit }) => {
			const send = (eventName: string, data: RunWithUser | { id: string }) => {
				logger.info({ eventName, data }, 'Emitting server event');
				emit(eventName, JSON.stringify(data));
			};

			onNew = (entry: RunWithUser) => send(ServerEvent.RunCreated, entry);
			onUpdate = (entry: RunWithUser) => send(ServerEvent.RunUpdated, entry);
			onDelete = (entry: { id: string }) => send(ServerEvent.RunDeleted, entry);

			resultEmitter.on(ServerEvent.RunCreated, onNew);
			resultEmitter.on(ServerEvent.RunUpdated, onUpdate);
			resultEmitter.on(ServerEvent.RunDeleted, onDelete);

			// TODO: In the future, we could proxy SSE events from Go API
			// For now, we maintain the existing event emitter approach
		},
		{
			stop() {
				resultEmitter.off(ServerEvent.RunCreated, onNew);
				resultEmitter.off(ServerEvent.RunUpdated, onUpdate);
				resultEmitter.off(ServerEvent.RunDeleted, onDelete);
			}
		}
	);
};
