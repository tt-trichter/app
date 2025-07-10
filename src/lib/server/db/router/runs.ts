import type { RunDco, Run, RunDatabseInsertObject, RunWithUser } from '$lib/models/run';
import { db } from '$lib/server/db';
import { runsTable } from '$lib/server/db/schema/runs';
import { user } from '$lib/server/db/schema/auth-schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function saveRun(runDco: RunDco, userId?: string | null): Promise<RunWithUser> {
	const runData: RunDatabseInsertObject = {
		userId: userId || null,
		image: runDco.image,
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

	if (newRun.userId) {
		const userResult = await db
			.select({
				id: user.id,
				name: user.name,
				username: user.username
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
			image: runsTable.image,
			createdAt: runsTable.createdAt,
			user: {
				id: user.id,
				name: user.name,
				username: user.username
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
			name: user.name,
			username: user.username
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

export interface UserStats {
	personalBest: number;
	totalLiters: number;
	averageRate: number;
	totalRuns: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
	const userRuns = await db
		.select({
			data: runsTable.data
		})
		.from(runsTable)
		.where(eq(runsTable.userId, userId));

	if (userRuns.length === 0) {
		return {
			personalBest: 0,
			totalLiters: 0,
			averageRate: 0,
			totalRuns: 0
		};
	}

	const rates = userRuns.map((run) => run.data.rate);
	const volumes = userRuns.map((run) => run.data.volume);

	const personalBest = Math.max(...rates);
	const totalLiters = volumes.reduce((sum, volume) => sum + volume, 0);
	const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

	return {
		personalBest: Math.round(personalBest * 100) / 100,
		totalLiters: Math.round(totalLiters * 100) / 100,
		averageRate: Math.round(averageRate * 100) / 100,
		totalRuns: userRuns.length
	};
}

export async function getRecentRunsForUser(userId: string, limit: number = 3): Promise<Run[]> {
	const runs = await db
		.select({
			id: runsTable.id,
			userId: runsTable.userId,
			data: runsTable.data,
			image: runsTable.image,
			createdAt: runsTable.createdAt
		})
		.from(runsTable)
		.where(eq(runsTable.userId, userId))
		.orderBy(desc(runsTable.createdAt))
		.limit(limit);

	return runs;
}
