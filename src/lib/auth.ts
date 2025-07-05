import { betterAuth, type User } from 'better-auth';
import { admin, username } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
import * as auth_schema from '$lib/server/db/schema/auth-schema';
import { logger } from './logger';

const isDev = env.NODE_ENV === 'development';
const baseUrl = isDev ? 'http://localhost:5173' : 'https://trichter.hauptspeicher.com';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...auth_schema
		}
	}),
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		google: {
			clientId: PUBLIC_GOOGLE_CLIENT_ID as string,
			clientSecret: GOOGLE_CLIENT_SECRET as string
		}
	},
	plugins: [admin(), username()],
	databaseHooks: {
		user: {
			create: {
				before: async (user: any) => {
					logger.info('Creating user:', user);
					if (!user.username && user.name) {
						let generatedUsername = user.name
							.toLowerCase()
							.replace(/[^a-z0-9]/g, '-')
							.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
							.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

						if (!generatedUsername) {
							generatedUsername = 'user';
						}

						const timestamp = Date.now().toString().slice(-4);
						const finalUsername = `${generatedUsername}-${timestamp}`;

						user.username = finalUsername;
						user.displayUsername = user.name;
					} else if (user.username && !user.displayUsername) {
						user.displayUsername = user.username;
					}

					return user;
				}
			}
		}
	}
});
