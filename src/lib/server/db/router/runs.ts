import type { RunDco, Run, RunDatabseInsertObject, RunWithUser } from '$lib/models/run';
import { db } from '$lib/server/db';
import { runsTable } from '$lib/server/db/schema/runs';
import { user } from '$lib/server/db/schema/auth-schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function saveRun(runDco: RunDco, userId?: string | null): Promise<RunWithUser> {
	// Transform RunDco to RunDatabaseInsertObject
	const runData: RunDatabseInsertObject = {
		userId: userId || null,
		data: {
			duration: runDco.duration,
			rate: runDco.rate,
			volume: runDco.volume
		}
	};

	const created = await db.insert(runsTable).values(runData).returning();

	if (created.length === 0) {
		throw new Error(`Failed to create Run`);
	}

	const newRun = created[0];

	// If there's a userId, fetch the user data
	if (newRun.userId) {
		const userResult = await db
			.select({
				id: user.id,
				name: user.name
			})
			.from(user)
			.where(eq(user.id, newRun.userId))
			.limit(1);

		return {
			...newRun,
			user: userResult.length > 0 ? userResult[0] : null
		};
	}

	return {
		...newRun,
		user: null
	};
}

export async function getAllRuns(): Promise<Run[]> {
	return db.query.runsTable.findMany();
}

export async function getAllRunsWithUsers(): Promise<RunWithUser[]> {
	const runs = await db
		.select({
			id: runsTable.id,
			userId: runsTable.userId,
			data: runsTable.data,
			createdAt: runsTable.createdAt,
			user: {
				id: user.id,
				name: user.name
			}
		})
		.from(runsTable)
		.leftJoin(user, eq(runsTable.userId, user.id))
		.orderBy(desc(sql`(${runsTable.data}->>'rate')::float`));

	return runs.map((run) => ({
		...run,
		user: run.user && run.user.id ? run.user : null
	}));
}

export async function updateRunWithUser(
	runId: string,
	userId: string
): Promise<RunWithUser | null> {
	const updated = await db
		.update(runsTable)
		.set({ userId })
		.where(eq(runsTable.id, runId))
		.returning();

	if (updated.length === 0) {
		return null;
	}

	const updatedRun = updated[0];

	const userResult = await db
		.select({
			id: user.id,
			name: user.name
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	return {
		...updatedRun,
		user: userResult.length > 0 ? userResult[0] : null
	};
}

export async function deleteRun(runId: string): Promise<boolean> {
	const deleted = await db.delete(runsTable).where(eq(runsTable.id, runId)).returning();

	return deleted.length > 0;
}
