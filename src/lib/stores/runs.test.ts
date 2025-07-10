import { describe, it, expect, beforeEach } from 'vitest';
import { RunsStore } from '$lib/stores/runs.svelte';
import type { RunWithUser } from '$lib/models/run';

// Mock browser environment
Object.defineProperty(global, 'browser', {
	value: false,
	writable: true
});

describe('RunsStore', () => {
	let store: RunsStore;

	beforeEach(() => {
		store = new RunsStore();
	});

	it('should initialize with empty runs', () => {
		expect(store.runs).toEqual([]);
		expect(store.isLoading).toBe(false);
		expect(store.error).toBe(null);
		expect(store.totalRuns).toBe(0);
	});

	it('should initialize with provided runs', () => {
		const mockRuns: RunWithUser[] = [
			{
				id: '1',
				userId: '1',
				image: 'test.jpg',
				data: { rate: 10.5, volume: 2.1, duration: 12.0 },
				createdAt: new Date(),
				user: { id: '1', name: 'Test User', username: 'testuser' }
			}
		];

		store.initialize(mockRuns);
		expect(store.runs).toEqual(mockRuns);
		expect(store.totalRuns).toBe(1);
	});

	it('should sort runs by rate correctly', () => {
		const mockRuns: RunWithUser[] = [
			{
				id: '1',
				userId: null,
				image: 'test1.jpg',
				data: { rate: 5.0, volume: 1.0, duration: 12.0 },
				createdAt: new Date(),
				user: null
			},
			{
				id: '2',
				userId: null,
				image: 'test2.jpg',
				data: { rate: 10.0, volume: 2.0, duration: 12.0 },
				createdAt: new Date(),
				user: null
			}
		];

		store.initialize(mockRuns);
		const sortedRuns = store.runsByRate;

		expect(sortedRuns[0].data.rate).toBe(10.0);
		expect(sortedRuns[1].data.rate).toBe(5.0);
	});

	it('should update or add runs correctly', () => {
		const mockRun: RunWithUser = {
			id: '1',
			userId: null,
			image: 'test.jpg',
			data: { rate: 10.5, volume: 2.1, duration: 12.0 },
			createdAt: new Date(),
			user: null
		};

		// Add new run
		store.updateOrAddRun(mockRun);
		expect(store.runs.length).toBe(1);
		expect(store.runs[0]).toEqual(mockRun);

		// Update existing run
		const updatedRun = { ...mockRun, data: { ...mockRun.data, rate: 15.0 } };
		store.updateOrAddRun(updatedRun);
		expect(store.runs.length).toBe(1);
		expect(store.runs[0].data.rate).toBe(15.0);
	});

	it('should remove runs correctly', () => {
		const mockRun: RunWithUser = {
			id: '1',
			userId: null,
			image: 'test.jpg',
			data: { rate: 10.5, volume: 2.1, duration: 12.0 },
			createdAt: new Date(),
			user: null
		};

		store.updateOrAddRun(mockRun);
		expect(store.runs.length).toBe(1);

		store.removeRun('1');
		expect(store.runs.length).toBe(0);
	});

	it('should find quickest run correctly', () => {
		const mockRuns: RunWithUser[] = [
			{
				id: '1',
				userId: null,
				image: 'test1.jpg',
				data: { rate: 5.0, volume: 1.0, duration: 15.0 },
				createdAt: new Date(),
				user: null
			},
			{
				id: '2',
				userId: null,
				image: 'test2.jpg',
				data: { rate: 10.0, volume: 2.0, duration: 8.0 },
				createdAt: new Date(),
				user: null
			}
		];

		store.initialize(mockRuns);
		const quickest = store.quickestRun;

		expect(quickest?.id).toBe('2');
		expect(quickest?.data.duration).toBe(8.0);
	});
});
