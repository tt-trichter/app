import { error, redirect, fail } from '@sveltejs/kit';
import { Role } from '$lib/models/roles';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema/auth-schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '$lib/logger';

const createUserSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Valid email is required'),
	username: z.string().min(3, 'Username must be at least 3 characters'),
	role: z.enum(['admin', 'user']),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

const updateUserSchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Valid email is required'),
	username: z.string().min(3, 'Username must be at least 3 characters'),
	role: z.enum(['admin', 'user']),
	banned: z.boolean().optional(),
	banReason: z.string().optional(),
	banExpiresIn: z.number().optional() // Changed to seconds for better-auth API
});

export const load: PageServerLoad = async ({ request }) => {
	const data = await auth.api.getSession({
		headers: request.headers
	});

	if (!data?.user) {
		redirect(302, '/auth/signin');
	}

	if (data.user.role !== Role.Admin) {
		logger.warn('Unauthorized admin access attempt', {
			userId: data.user.id,
			userRole: data.user.role
		});
		error(403, {
			code: 403,
			message: 'Forbidden'
		});
	}

	logger.info('Admin panel accessed', { adminUserId: data.user.id });

	// Use better-auth admin API to list users
	try {
		const usersResponse = await auth.api.listUsers({
			headers: request.headers,
			query: {
				limit: 1000 // Get all users for now
			}
		});

		logger.info('Users fetched successfully', {
			userCount: usersResponse.users.length,
			adminUserId: data.user.id
		});

		return {
			users: usersResponse.users
		};
	} catch (err) {
		logger.error('Failed to fetch users via admin API, falling back to direct DB query:', err);
		// Fallback to direct DB query if admin API fails
		const users = await db.select().from(user).orderBy(user.createdAt);

		logger.info('Users fetched via direct DB query', {
			userCount: users.length,
			adminUserId: data.user.id
		});

		return {
			users
		};
	}
};

export const actions: Actions = {
	createUser: async ({ request }) => {
		const data = await auth.api.getSession({
			headers: request.headers
		});

		if (!data?.user || data.user.role !== Role.Admin) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = createUserSchema.safeParse({
			name: formData.get('name'),
			email: formData.get('email'),
			username: formData.get('username'),
			role: formData.get('role'),
			password: formData.get('password')
		});

		if (!result.success) {
			return fail(400, {
				error: 'Validation failed',
				fieldErrors: result.error.flatten().fieldErrors
			});
		}

		try {
			// Use better-auth admin API to create user
			await auth.api.createUser({
				headers: request.headers,
				body: {
					name: result.data.name,
					email: result.data.email,
					password: result.data.password,
					role: result.data.role,
					data: {
						username: result.data.username
					}
				}
			});

			logger.info('User created successfully', {
				email: result.data.email,
				username: result.data.username,
				role: result.data.role
			});
			return { success: true, message: 'User created successfully' };
		} catch (err) {
			logger.error('Failed to create user:', err);
			return fail(500, { error: 'Failed to create user' });
		}
	},

	updateUser: async ({ request }) => {
		const data = await auth.api.getSession({
			headers: request.headers
		});

		if (!data?.user || data.user.role !== Role.Admin) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = updateUserSchema.safeParse({
			id: formData.get('id'),
			name: formData.get('name'),
			email: formData.get('email'),
			username: formData.get('username'),
			role: formData.get('role'),
			banned: formData.get('banned') === 'true',
			banReason: formData.get('banReason'),
			banExpiresIn: formData.get('banExpires')
				? Math.floor((new Date(formData.get('banExpires') as string).getTime() - Date.now()) / 1000)
				: undefined
		});

		if (!result.success) {
			return fail(400, {
				error: 'Validation failed',
				fieldErrors: result.error.flatten().fieldErrors
			});
		}

		try {
			const userId = result.data.id;

			// Update user role if changed
			await auth.api.setRole({
				headers: request.headers,
				body: {
					userId,
					role: result.data.role
				}
			});

			// Handle ban/unban
			if (result.data.banned !== undefined) {
				if (result.data.banned) {
					await auth.api.banUser({
						headers: request.headers,
						body: {
							userId,
							banReason: result.data.banReason,
							banExpiresIn: result.data.banExpiresIn
						}
					});
				} else {
					await auth.api.unbanUser({
						headers: request.headers,
						body: {
							userId
						}
					});
				}
			}

			// Update basic user info (name, email, username) - need to use direct DB update for this
			await db
				.update(user)
				.set({
					name: result.data.name,
					email: result.data.email,
					username: result.data.username,
					updatedAt: new Date()
				})
				.where(eq(user.id, userId));

			logger.info('User updated successfully', {
				userId,
				email: result.data.email,
				role: result.data.role,
				banned: result.data.banned
			});
			return { success: true, message: 'User updated successfully' };
		} catch (err) {
			logger.error('Failed to update user:', err);
			return fail(500, { error: 'Failed to update user' });
		}
	},

	deleteUser: async ({ request }) => {
		const data = await auth.api.getSession({
			headers: request.headers
		});

		if (!data?.user || data.user.role !== Role.Admin) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Prevent deleting yourself
		if (userId === data.user.id) {
			return fail(400, { error: 'Cannot delete your own account' });
		}

		try {
			// Use better-auth admin API to remove user
			await auth.api.removeUser({
				headers: request.headers,
				body: {
					userId
				}
			});

			logger.info('User deleted successfully', { userId });
			return { success: true, message: 'User deleted successfully' };
		} catch (err) {
			logger.error('Failed to delete user:', err);
			return fail(500, { error: 'Failed to delete user' });
		}
	},

	toggleEmailVerification: async ({ request }) => {
		const data = await auth.api.getSession({
			headers: request.headers
		});

		if (!data?.user || data.user.role !== Role.Admin) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const emailVerified = formData.get('emailVerified') === 'true';

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		try {
			// Update email verification status directly in the database
			await db
				.update(user)
				.set({
					emailVerified: emailVerified,
					updatedAt: new Date()
				})
				.where(eq(user.id, userId));

			logger.info('Email verification status updated', {
				userId,
				emailVerified,
				adminUserId: data.user.id
			});
			return {
				success: true,
				message: `User email ${emailVerified ? 'verified' : 'unverified'} successfully`
			};
		} catch (err) {
			logger.error('Failed to update email verification status:', err);
			return fail(500, { error: 'Failed to update email verification status' });
		}
	}
};
