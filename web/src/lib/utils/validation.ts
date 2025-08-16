import { z } from 'zod';

export const userValidation = {
	email: z.string().email('Valid email is required'),
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(50, 'Username too long'),
	name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	role: z.enum(['admin', 'user'], { required_error: 'Role is required' })
};

export const idValidation = {
	uuid: z.string().uuid('Invalid ID format'),
	nonEmpty: z.string().min(1, 'ID is required')
};

export const createUserSchema = z.object({
	name: userValidation.name,
	email: userValidation.email,
	username: userValidation.username,
	role: userValidation.role,
	password: userValidation.password
});

export const updateUserSchema = z.object({
	id: idValidation.nonEmpty,
	name: userValidation.name,
	email: userValidation.email,
	username: userValidation.username,
	role: userValidation.role,
	banned: z.boolean().optional(),
	banReason: z.string().optional(),
	banExpiresIn: z.number().positive().optional()
});

export const runValidation = {
	duration: z.number().positive('Duration must be a positive number'),
	rate: z.number().positive('Rate must be a positive number'),
	volume: z.number().positive('Volume must be a positive number'),
	image: z.string().default('trichter-images/placeholder.jpg')
};

export const createRunSchema = z.object(runValidation);

export const searchValidation = {
	query: z.string().min(2, 'Search query must be at least 2 characters'),
	limit: z.number().int().min(1).max(100).default(10)
};

export function validateData<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	return { success: false, error: result.error };
}

export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
	const flattened = error.flatten().fieldErrors;
	const result: Record<string, string[]> = {};

	for (const [key, value] of Object.entries(flattened)) {
		if (value) {
			result[key] = value;
		}
	}

	return result;
}

export function getFirstValidationError(error: z.ZodError): string {
	const issues = error.issues;
	if (issues.length > 0) {
		return issues[0].message;
	}
	return 'Validation failed';
}

export function validateRequiredFields(
	fields: Record<string, unknown>
): { success: true } | { success: false; error: string } {
	for (const [key, value] of Object.entries(fields)) {
		if (!value || (typeof value === 'string' && value.trim() === '')) {
			return { success: false, error: `Field '${key}' is required` };
		}
	}

	return { success: true };
}

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type CreateRunData = z.infer<typeof createRunSchema>;
