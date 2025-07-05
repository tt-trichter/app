import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as runsSchema from '$lib/server/db/schema/runs';
import * as authSchema from '$lib/server/db/schema/auth-schema';

export const db = drizzle({
	connection: {
		connectionString: env.DATABASE_URL
	},
	schema: { ...runsSchema, ...authSchema }
});
