import { browser } from '$app/environment';
import pino, { type LoggerOptions } from 'pino';
import type { LokiOptions } from 'pino-loki';

const defaultLogLevel: LoggerOptions['level'] = 'trace';

export function createLogger() {
	const options: LoggerOptions = {
		level: defaultLogLevel,
		formatters: {
			level: (label) => ({ level: label.toUpperCase() })
		}
	};

	if (browser || process.env.NODE_ENV != 'production') {
		options.transport = {
			target: 'pino-pretty',
			options: { colorize: true, levelFirst: true, translateTime: true }
		};
		return pino(options);
	}

	const lokiTransport = pino.transport<LokiOptions>({
		target: 'pino-loki',
		options: {
			host: process.env.LOKI_HOST ?? 'http://loki:3100',
			basicAuth: {
				username: process.env.LOKI_USER ?? '',
				password: process.env.LOKI_PASS ?? ''
			},
			batching: true,
			interval: 5,
			labels: { app: 'trichter-app', env: process.env.NODE_ENV || 'production' }
		}
	});

	return pino(options, lokiTransport);
}

export const logger = createLogger();
