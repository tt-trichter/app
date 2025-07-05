import type { User } from '$lib/models/user';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema/auth-schema';
import { like, or, eq } from 'drizzle-orm';

export async function searchUsers(query: string, limit: number = 10): Promise<User[]> {
	if (!query.trim()) {
		return [];
	}

	const searchTerm = `%${query.trim().toLowerCase()}%`;

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			username: user.username,
			displayUsername: user.displayUsername,
			image: user.image,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			role: user.role,
			banned: user.banned,
			banReason: user.banReason,
			banExpires: user.banExpires
		})
		.from(user)
		.where(
			or(
				like(user.name, searchTerm),
				like(user.username, searchTerm),
				like(user.displayUsername, searchTerm)
			)
		)
		.limit(limit);

	return users;
}

export async function getUserById(id: string): Promise<User | null> {
	const users = await db.select().from(user).where(eq(user.id, id)).limit(1);

	return users.length > 0 ? users[0] : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
	const users = await db.select().from(user).where(eq(user.username, username)).limit(1);

	return users.length > 0 ? users[0] : null;
}
