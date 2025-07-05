import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const runsTable = pgTable('runs', {
	id: uuid().primaryKey().defaultRandom(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	data: jsonb('data')
		.$type<{
			duration: number;
			rate: number;
			volume: number;
		}>()
		.notNull(),
	createdAt: timestamp('created_at')
		.$defaultFn(() => new Date())
		.notNull()
});
