import type { RunWithUser } from '$lib/models/run';
import { ServerEvent } from '$lib/models/events';
import { produce } from 'sveltekit-sse';
import { resultEmitter } from '$lib/server/events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = () => {
	let onNew: (entry: RunWithUser) => void;
	let onUpdate: (entry: RunWithUser) => void;

	return produce(
		async ({ emit }) => {
			const send = (eventName: string, data: RunWithUser) => {
				emit(eventName, JSON.stringify(data));
			};

			onNew = (entry: RunWithUser) => send(ServerEvent.RunCreated, entry);
			onUpdate = (entry: RunWithUser) => send(ServerEvent.RunUpdated, entry);

			resultEmitter.on(ServerEvent.RunCreated, onNew);
			resultEmitter.on(ServerEvent.RunUpdated, onUpdate);
		},
		{
			stop() {
				resultEmitter.off(ServerEvent.RunCreated, onNew);
				resultEmitter.off(ServerEvent.RunUpdated, onUpdate);
			}
		}
	);
};
