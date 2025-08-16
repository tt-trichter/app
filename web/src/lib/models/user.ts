import type { user } from '$lib/server/db/schema/auth-schema';

export type User = typeof user.$inferSelect;
