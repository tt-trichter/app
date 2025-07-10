import { logger as baseLogger } from '../logger';

interface LogContext {
	userId?: string;
	requestId?: string;
	operation?: string;
	duration?: number;
	[key: string]: unknown;
}

interface DatabaseLogContext extends LogContext {
	table?: string;
	query?: string;
	rowCount?: number;
}

interface ApiLogContext extends LogContext {
	method?: string;
	path?: string;
	statusCode?: number;
	userAgent?: string;
}

export const structuredLogger = {
	api: {
		request: (message: string, context: ApiLogContext = {}) => {
			baseLogger.info({ ...context, type: 'api_request' }, message);
		},
		response: (message: string, context: ApiLogContext = {}) => {
			baseLogger.info({ ...context, type: 'api_response' }, message);
		},
		error: (message: string, error: unknown, context: ApiLogContext = {}) => {
			baseLogger.error({ ...context, error, type: 'api_error' }, message);
		}
	},

	database: {
		query: (message: string, context: DatabaseLogContext = {}) => {
			baseLogger.debug({ ...context, type: 'database_query' }, message);
		},
		success: (message: string, context: DatabaseLogContext = {}) => {
			baseLogger.info({ ...context, type: 'database_success' }, message);
		},
		error: (message: string, error: unknown, context: DatabaseLogContext = {}) => {
			baseLogger.error({ ...context, error, type: 'database_error' }, message);
		}
	},

	auth: {
		login: (message: string, context: LogContext = {}) => {
			baseLogger.info({ ...context, type: 'auth_login' }, message);
		},
		logout: (message: string, context: LogContext = {}) => {
			baseLogger.info({ ...context, type: 'auth_logout' }, message);
		},
		unauthorized: (message: string, context: LogContext = {}) => {
			baseLogger.warn({ ...context, type: 'auth_unauthorized' }, message);
		},
		error: (message: string, error: unknown, context: LogContext = {}) => {
			baseLogger.error({ ...context, error, type: 'auth_error' }, message);
		}
	},

	business: {
		info: (message: string, context: LogContext = {}) => {
			baseLogger.info({ ...context, type: 'logic_info' }, message);
		},
		warning: (message: string, context: LogContext = {}) => {
			baseLogger.warn({ ...context, type: 'logic_warning' }, message);
		},
		error: (message: string, error: unknown, context: LogContext = {}) => {
			baseLogger.error({ ...context, error, type: 'logic_error' }, message);
		}
	}
};

export function createPerformanceTimer(operation: string, context: LogContext = {}) {
	const startTime = performance.now();

	return {
		end: (message?: string) => {
			const duration = performance.now() - startTime;
			baseLogger.info(
				{ ...context, operation, duration, type: 'performance' },
				message || `${operation} completed in ${duration.toFixed(2)}ms`
			);
			return duration;
		}
	};
}
